'use server'

/**
 * Server Actions pour la gestion des demandes de versement
 * Permet aux utilisateurs de demander le versement de leurs rétributions
 * Permet aux trésoriers de valider/rejeter/payer les demandes
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createDemandeVersement,
  validateDemande,
  markDemandePaid,
  rejectDemande,
  getUserBalance,
} from "@/lib/supabase/versement";
import { VERSEMENT_CONFIG, isTreasurerRole } from "@/lib/config";
import {
  CreateDemandeVersementInput,
  ValiderDemandeInput,
  MarquerPayeeInput,
  RejeterDemandeInput,
  TypeVersement,
} from "@/lib/types";

// =====================================================
// TYPES DE RETOUR
// =====================================================

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

// =====================================================
// ACTIONS UTILISATEUR
// =====================================================

/**
 * Crée une nouvelle demande de versement
 * Vérifie le solde disponible et les montants min/max
 */
export async function creerDemandeVersementAction(
  input: CreateDemandeVersementInput
): Promise<ActionResult<{ demande_id: string }>> {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Non authentifié" };
    }

    // Validation des données
    const { montant, type_versement, iban, nom_beneficiaire, notes_utilisateur } = input;

    // Vérifier montant minimum
    if (montant < VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT) {
      return {
        success: false,
        error: `Le montant minimum est de ${VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT}€`,
      };
    }

    // Vérifier montant maximum
    if (montant > VERSEMENT_CONFIG.MONTANT_MAXIMUM_VERSEMENT) {
      return {
        success: false,
        error: `Le montant maximum est de ${VERSEMENT_CONFIG.MONTANT_MAXIMUM_VERSEMENT}€`,
      };
    }

    // Vérifier que pour un virement, le montant minimum est respecté
    if (type_versement === TypeVersement.VIREMENT && montant < VERSEMENT_CONFIG.MONTANT_MINIMUM_VIREMENT) {
      return {
        success: false,
        error: `Le montant minimum pour un virement est de ${VERSEMENT_CONFIG.MONTANT_MINIMUM_VIREMENT}€`,
      };
    }

    // Vérifier l'IBAN si virement
    if (type_versement === TypeVersement.VIREMENT) {
      if (!iban || !nom_beneficiaire) {
        return {
          success: false,
          error: "L'IBAN et le nom du bénéficiaire sont requis pour un virement",
        };
      }

      // Validation basique de l'IBAN (devrait commencer par 2 lettres)
      const ibanCleaned = iban.replace(/\s/g, '');
      if (ibanCleaned.length < 15 || !/^[A-Z]{2}/.test(ibanCleaned)) {
        return {
          success: false,
          error: "L'IBAN semble invalide",
        };
      }
    }

    // Vérifier le solde disponible
    const soldeDisponible = await getUserBalance(supabase, user.id);

    if (soldeDisponible < montant) {
      return {
        success: false,
        error: `Solde insuffisant. Disponible: ${soldeDisponible.toFixed(2)}€`,
      };
    }

    // Créer la demande via la fonction PostgreSQL
    const result = await createDemandeVersement(supabase, {
      montant,
      type_versement,
      iban,
      nom_beneficiaire,
      notes_utilisateur,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erreur lors de la création de la demande",
      };
    }

    // Revalider les pages concernées
    revalidatePath('/mon-compte');
    revalidatePath('/tresorerie');

    return {
      success: true,
      data: { demande_id: result.demande_id! },
    };
  } catch (error: any) {
    console.error('Error in creerDemandeVersementAction:', error);
    return {
      success: false,
      error: error?.message || "Une erreur est survenue",
    };
  }
}

/**
 * Annule une demande en attente
 * Seul l'utilisateur peut annuler sa propre demande, et uniquement si elle est en attente
 */
export async function annulerDemandeAction(
  demandeId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Non authentifié" };
    }

    // Récupérer la demande pour vérifier qu'elle appartient à l'utilisateur
    const { data: demande, error: fetchError } = await supabase
      .from('demandes_versement')
      .select('*')
      .eq('id', demandeId)
      .single();

    if (fetchError || !demande) {
      return { success: false, error: "Demande introuvable" };
    }

    if (demande.user_id !== user.id) {
      return { success: false, error: "Non autorisé" };
    }

    if (demande.statut !== 'en_attente') {
      return { success: false, error: "Seules les demandes en attente peuvent être annulées" };
    }

    // Débloquer le montant et supprimer la demande
    const { error: deleteError } = await supabase
      .from('demandes_versement')
      .delete()
      .eq('id', demandeId);

    if (deleteError) {
      throw deleteError;
    }

    // Débloquer le montant
    await supabase
      .from('comptes_sp')
      .update({
        solde_disponible: supabase.rpc('increment', { row_id: user.id, amount: demande.montant }),
        solde_bloque: supabase.rpc('decrement', { row_id: user.id, amount: demande.montant }),
      })
      .eq('user_id', user.id);

    // Revalider les pages
    revalidatePath('/mon-compte');

    return { success: true };
  } catch (error: any) {
    console.error('Error in annulerDemandeAction:', error);
    return {
      success: false,
      error: error?.message || "Une erreur est survenue",
    };
  }
}

// =====================================================
// ACTIONS TRÉSORIER
// =====================================================

/**
 * Valide une demande de versement (trésorier uniquement)
 * Passe la demande en statut "en_cours"
 */
export async function validerDemandeAction(
  input: ValiderDemandeInput
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification et les permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !isTreasurerRole(profile.role)) {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires",
      };
    }

    // Valider la demande via la fonction PostgreSQL
    const result = await validateDemande(
      supabase,
      input.demande_id,
      input.notes_tresorier
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erreur lors de la validation",
      };
    }

    // Revalider les pages
    revalidatePath('/tresorerie');
    revalidatePath('/mon-compte');

    return { success: true };
  } catch (error: any) {
    console.error('Error in validerDemandeAction:', error);
    return {
      success: false,
      error: error?.message || "Une erreur est survenue",
    };
  }
}

/**
 * Marque une demande comme payée (trésorier uniquement)
 * Débite définitivement le compte utilisateur
 */
export async function marquerPayeeAction(
  input: MarquerPayeeInput
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification et les permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !isTreasurerRole(profile.role)) {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires",
      };
    }

    // Marquer comme payée via la fonction PostgreSQL
    const result = await markDemandePaid(
      supabase,
      input.demande_id,
      input.preuve_paiement_url
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erreur lors du marquage comme payée",
      };
    }

    // Revalider les pages
    revalidatePath('/tresorerie');
    revalidatePath('/mon-compte');

    return { success: true };
  } catch (error: any) {
    console.error('Error in marquerPayeeAction:', error);
    return {
      success: false,
      error: error?.message || "Une erreur est survenue",
    };
  }
}

/**
 * Rejette une demande de versement (trésorier uniquement)
 * Débloque le montant dans le compte utilisateur
 */
export async function rejeterDemandeAction(
  input: RejeterDemandeInput
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification et les permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !isTreasurerRole(profile.role)) {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires",
      };
    }

    // Valider que la raison est fournie
    if (!input.raison || input.raison.trim().length < 10) {
      return {
        success: false,
        error: "Veuillez fournir une raison détaillée (minimum 10 caractères)",
      };
    }

    // Rejeter la demande via la fonction PostgreSQL
    const result = await rejectDemande(
      supabase,
      input.demande_id,
      input.raison
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erreur lors du rejet",
      };
    }

    // Revalider les pages
    revalidatePath('/tresorerie');
    revalidatePath('/mon-compte');

    return { success: true };
  } catch (error: any) {
    console.error('Error in rejeterDemandeAction:', error);
    return {
      success: false,
      error: error?.message || "Une erreur est survenue",
    };
  }
}
