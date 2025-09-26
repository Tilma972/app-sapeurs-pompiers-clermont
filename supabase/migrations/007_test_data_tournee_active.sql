-- Migration: Données de test pour une tournée active
-- Description: Script pour créer des données de test réalistes pour tester l'application

DO $$
DECLARE
    -- Variable pour l'ID utilisateur de test (à remplacer manuellement)
    test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- REMPLACER PAR VOTRE UUID
    
    -- Variables pour les données de test
    test_tournee_id UUID;
    test_profile_exists BOOLEAN;
    test_tournee_exists BOOLEAN;
    
BEGIN
    -- Vérification que l'ID utilisateur a été modifié
    IF test_user_id = '00000000-0000-0000-0000-000000000000' THEN
        RAISE EXCEPTION 'ERREUR: Veuillez remplacer test_user_id par un UUID valide d''utilisateur de test';
    END IF;
    
    -- Vérifier si l'utilisateur existe dans auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
        RAISE EXCEPTION 'ERREUR: L''utilisateur avec l''ID % n''existe pas dans auth.users', test_user_id;
    END IF;
    
    -- 1. Créer ou mettre à jour le profil utilisateur
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = test_user_id) INTO test_profile_exists;
    
    IF test_profile_exists THEN
        -- Mettre à jour le profil existant
        UPDATE public.profiles 
        SET 
            full_name = 'Jean Dupont',
            team = 'Équipe Alpha',
            role = 'sapeur_pompier',
            updated_at = NOW()
        WHERE id = test_user_id;
        
        RAISE NOTICE 'Profil utilisateur mis à jour pour %', test_user_id;
    ELSE
        -- Créer un nouveau profil
        INSERT INTO public.profiles (
            id,
            full_name,
            team,
            role,
            created_at,
            updated_at
        ) VALUES (
            test_user_id,
            'Jean Dupont',
            'Équipe Alpha',
            'sapeur_pompier',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Nouveau profil créé pour %', test_user_id;
    END IF;
    
    -- 2. Vérifier s'il existe déjà une tournée active
    SELECT EXISTS(
        SELECT 1 FROM public.tournees 
        WHERE user_id = test_user_id AND statut = 'active'
    ) INTO test_tournee_exists;
    
    IF test_tournee_exists THEN
        RAISE NOTICE 'Une tournée active existe déjà pour cet utilisateur';
        
        -- Récupérer l'ID de la tournée existante
        SELECT id INTO test_tournee_id 
        FROM public.tournees 
        WHERE user_id = test_user_id AND statut = 'active' 
        LIMIT 1;
        
    ELSE
        -- 3. Créer une nouvelle tournée active
        INSERT INTO public.tournees (
            id,
            user_id,
            date_debut,
            statut,
            zone,
            calendriers_alloues,
            calendriers_distribues,
            montant_collecte,
            notes,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            test_user_id,
            NOW(),
            'active',
            'Secteur Centre-Ville - Zone A',
            50,
            0,
            0.00,
            'Tournée de test pour validation de l''application',
            NOW(),
            NOW()
        ) RETURNING id INTO test_tournee_id;
        
        RAISE NOTICE 'Nouvelle tournée active créée avec l''ID: %', test_tournee_id;
    END IF;
    
    -- 4. Créer quelques transactions de test (optionnel)
    -- Supprimer d'abord les transactions existantes pour cette tournée
    DELETE FROM public.support_transactions WHERE tournee_id = test_tournee_id;
    
    -- Insérer des transactions de test variées
    INSERT INTO public.support_transactions (
        id,
        tournee_id,
        user_id,
        amount,
        calendar_accepted,
        supporter_name,
        supporter_email,
        supporter_phone,
        payment_method,
        notes,
        created_at,
        updated_at
    ) VALUES 
    -- Transaction 1: Soutien avec calendrier
    (
        gen_random_uuid(),
        test_tournee_id,
        test_user_id,
        15.00,
        true, -- calendar_accepted = true (soutien)
        'Marie Martin',
        'marie.martin@email.com',
        '06 12 34 56 78',
        'especes',
        'Très sympathique, intéressée par les actions de l''amicale',
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '2 hours'
    ),
    -- Transaction 2: Don fiscal sans calendrier
    (
        gen_random_uuid(),
        test_tournee_id,
        test_user_id,
        25.00,
        false, -- calendar_accepted = false (don fiscal)
        'Pierre Durand',
        'pierre.durand@email.com',
        '06 87 65 43 21',
        'cheque',
        'Don fiscal pour soutenir l''amicale',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '1 hour'
    ),
    -- Transaction 3: Soutien avec calendrier (paiement carte)
    (
        gen_random_uuid(),
        test_tournee_id,
        test_user_id,
        10.00,
        true, -- calendar_accepted = true (soutien)
        'Sophie Leroy',
        'sophie.leroy@email.com',
        '06 11 22 33 44',
        'carte',
        'Paiement par carte bancaire',
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '30 minutes'
    ),
    -- Transaction 4: Don fiscal sans calendrier
    (
        gen_random_uuid(),
        test_tournee_id,
        test_user_id,
        20.00,
        false, -- calendar_accepted = false (don fiscal)
        'Michel Bernard',
        'michel.bernard@email.com',
        '06 99 88 77 66',
        'especes',
        'Don fiscal, très généreux',
        NOW() - INTERVAL '15 minutes',
        NOW() - INTERVAL '15 minutes'
    );
    
    RAISE NOTICE '4 transactions de test créées pour la tournée %', test_tournee_id;
    
    -- 5. Afficher un résumé des données créées
    RAISE NOTICE '=== RÉSUMÉ DES DONNÉES DE TEST ===';
    RAISE NOTICE 'Utilisateur de test: %', test_user_id;
    RAISE NOTICE 'Profil: Jean Dupont (Équipe Alpha)';
    RAISE NOTICE 'Tournée active: %', test_tournee_id;
    RAISE NOTICE 'Zone: Secteur Centre-Ville - Zone A';
    RAISE NOTICE 'Calendriers alloués: 50';
    RAISE NOTICE 'Transactions créées: 4 (2 soutiens + 2 dons fiscaux)';
    RAISE NOTICE '================================';
    
    -- 6. Vérification finale
    PERFORM 1 FROM public.profiles WHERE id = test_user_id;
    PERFORM 1 FROM public.tournees WHERE id = test_tournee_id AND statut = 'active';
    PERFORM 1 FROM public.support_transactions WHERE tournee_id = test_tournee_id;
    
    RAISE NOTICE '✅ Toutes les données de test ont été créées avec succès !';
    RAISE NOTICE 'Vous pouvez maintenant tester votre application Next.js avec ces données.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la création des données de test: %', SQLERRM;
END $$;

-- Commentaires pour l'utilisation
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger automatique pour créer un profil lors de l''inscription';
COMMENT ON TABLE public.profiles IS 'Profils des utilisateurs de l''amicale des sapeurs-pompiers';
COMMENT ON TABLE public.tournees IS 'Tournées de collecte des calendriers';
COMMENT ON TABLE public.support_transactions IS 'Transactions de soutien et dons fiscaux';
COMMENT ON VIEW public.tournee_summary IS 'Vue agrégée des statistiques de tournée';


