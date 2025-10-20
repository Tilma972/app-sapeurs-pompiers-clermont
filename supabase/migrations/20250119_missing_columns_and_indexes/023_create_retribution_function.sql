-- ============================================
-- Migration 023 (v2) : Fonction de clôture avec rétribution simplifiée
-- Date : 2025-01-20
-- Description : RPC sans paramètre pourcentage (utilise la préférence utilisateur)
-- ============================================

CREATE OR REPLACE FUNCTION cloturer_tournee_avec_retribution(
    p_tournee_id UUID,
    p_calendriers_vendus INTEGER,
    p_montant_total DECIMAL(10,2)
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_equipe_id UUID;
    v_retribution_active BOOLEAN;
    v_min_pot INT;
    v_recommande_pot INT;
    v_preference_user INT;
    v_pourcentage_final INT;
    v_montant_amicale DECIMAL(10,2);
    v_montant_pompier DECIMAL(10,2);
    v_montant_pot DECIMAL(10,2);
    v_montant_perso DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Vérifier tournée + équipe + flag rétribution
    SELECT t.user_id, t.equipe_id, e.enable_retribution, 
           COALESCE(e.pourcentage_minimum_pot, 0),
           COALESCE(e.pourcentage_recommande_pot, 30)
    INTO v_user_id, v_equipe_id, v_retribution_active, v_min_pot, v_recommande_pot
    FROM tournees t
    JOIN equipes e ON e.id = t.equipe_id
    WHERE t.id = p_tournee_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Tournée introuvable';
    END IF;

    IF NOT v_retribution_active THEN
        RAISE EXCEPTION 'La rétribution n''est pas activée pour cette équipe';
    END IF;

    -- Récupérer la préférence utilisateur (peut être NULL)
    SELECT pourcentage_pot_equipe_defaut
    INTO v_preference_user
    FROM comptes_sp
    WHERE user_id = v_user_id;

    -- Déterminer le pourcentage final
    IF v_preference_user IS NULL OR v_preference_user = 0 THEN
        v_pourcentage_final := v_recommande_pot;
    ELSE
        v_pourcentage_final := v_preference_user;
    END IF;

    -- S'assurer que le minimum d'équipe est respecté
    IF v_pourcentage_final < v_min_pot THEN
        v_pourcentage_final := v_min_pot;
    END IF;

    -- Calculs (arrondis 2 décimales)
    v_montant_amicale := ROUND(p_montant_total * 0.70, 2);
    v_montant_pompier := ROUND(p_montant_total * 0.30, 2);
    v_montant_pot := ROUND(v_montant_pompier * (v_pourcentage_final / 100.0), 2);
    v_montant_perso := ROUND(v_montant_pompier - v_montant_pot, 2);

    -- Clôturer la tournée
    UPDATE tournees SET
        statut = 'completed',
        date_fin = NOW(),
        calendriers_distribues = p_calendriers_vendus,
        montant_collecte = p_montant_total,
        updated_at = NOW()
    WHERE id = p_tournee_id;

    -- Mouvements
    INSERT INTO mouvements_retribution (
        tournee_id, user_id, equipe_id,
        montant_total_collecte, montant_amicale, montant_pompier_total,
        pourcentage_pot_equipe, montant_pot_equipe, montant_compte_perso,
        statut
    ) VALUES (
        p_tournee_id, v_user_id, v_equipe_id,
        p_montant_total, v_montant_amicale, v_montant_pompier,
        v_pourcentage_final, v_montant_pot, v_montant_perso,
        'valide'
    );

    -- Soldes
    INSERT INTO comptes_sp (user_id, solde_disponible, total_retributions)
    VALUES (v_user_id, v_montant_perso, v_montant_perso)
    ON CONFLICT (user_id) DO UPDATE SET
        solde_disponible = comptes_sp.solde_disponible + EXCLUDED.solde_disponible,
        total_retributions = comptes_sp.total_retributions + EXCLUDED.total_retributions,
        updated_at = NOW();

    IF v_montant_pot > 0 THEN
        INSERT INTO pots_equipe (equipe_id, solde_disponible)
        VALUES (v_equipe_id, v_montant_pot)
        ON CONFLICT (equipe_id) DO UPDATE SET
            solde_disponible = pots_equipe.solde_disponible + EXCLUDED.solde_disponible,
            updated_at = NOW();
    END IF;

    -- Résultat
    v_result := json_build_object(
        'success', true,
        'montant_total', p_montant_total,
        'montant_amicale', v_montant_amicale,
        'montant_pompier', v_montant_pompier,
        'montant_pot_equipe', v_montant_pot,
        'montant_compte_perso', v_montant_perso,
        'pourcentage_applique', v_pourcentage_final
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cloturer_tournee_avec_retribution(UUID, INTEGER, DECIMAL) TO authenticated;
