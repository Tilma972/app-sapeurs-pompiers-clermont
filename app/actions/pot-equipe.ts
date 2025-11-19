'use server'

/**
 * Server Actions pour la gestion des demandes de pot d'équipe
 * Permet aux chefs d'équipe de demander des fonds pour des activités
 * Permet aux trésoriers de valider/rejeter/payer les demandes
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createDemandePotEquipe,
  validateDemandePot,
  markDemandePotPaid,
  rejectDemandePot,
} from "@/lib/supabase/pot-equipe";
import { isTreasurerRole, isTeamLeaderRole } from "@/lib/config";
import {
  CreateDemandePotEquipeInput,
  ValiderDemandePotInput,
  MarquerPayeePotInput,
  RejeterDemandePotInput,
} from "@/lib/types/pot-equipe";

// =====================================================
// TYPES DE RETOUR
// =====================================================

type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

// =====================================================
// ACTIONS CHEF D'ÉQUIPE
// =====================================================

/**
 * Crée une nouvelle demande de pot d'équipe
 * Vérifie que l'utilisateur est chef d'équipe et que le solde est suffisant
 */
export async function creerDemandePotEquipeAction(
  input: Omit<CreateDemandePotEquipeInput, 'equipe_id'>
): Promise<ActionResult<{ demande_id: string }>> {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Non authentifié" };
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, team_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profil introuvable" };
    }

    // Vérifier que l'utilisateur est chef d'équipe ou admin
    if (!isTeamLeaderRole(profile.role)) {
      return {
        success: false,
        error: "Seuls les chefs d'équipe peuvent créer des demandes",
      };
    }

    // Vérifier que l'utilisateur a une équipe
    if (!profile.team_id) {
      return {
        success: false,
        error: "Vous devez être assigné à une équipe",
      };
    }

    // Validation des données
    const { titre, description, montant, categorie, notes_demandeur } = input;

    if (!titre || titre.trim().length < 5) {
      return {
        success: false,
        error: "Le titre doit contenir au moins 5 caractères",
      };
    }

    if (!description || description.trim().length < 10) {
      return {
        success: false,
        error: "La description doit contenir au moins 10 caractères",
      };
    }

    if (montant <= 0) {
      return {
        success: false,
        error: "Le montant doit être supérieur à 0",
      };
    }

    // Vérifier le solde de l'équipe
    const { data: equipe } = await supabase
      .from('equipes')
      .select('solde_pot_equipe')
      .eq('id', profile.team_id)
      .single();

    if (!equipe) {
      return { success: false, error: "Équipe introuvable" };
    }

    if (equipe.solde_pot_equipe < montant) {
      return {
        success: false,
        error: `Solde insuffisant. Disponible: ${equipe.solde_pot_equipe.toFixed(2)}€`,
      };
    }

    // Créer la demande via la fonction PostgreSQL
    const result = await createDemandePotEquipe(supabase, {
      equipe_id: profile.team_id,
      titre,
      description,
      montant,
      categorie,
      notes_demandeur,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Erreur lors de la création de la demande",
      };
    }

    // Revalider les pages concernées
    revalidatePath('/mon-compte');
    revalidatePath('/equipe');
    revalidatePath('/tresorerie');

    return {
      success: true,
      data: { demande_id: result.data!.demande_id },
    };
  } catch (error) {
    console.error('Error in creerDemandePotEquipeAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

// =====================================================
// ACTIONS TRÉSORIER
// =====================================================

/**
 * Valide une demande de pot d'équipe (trésorier uniquement)
 * Passe la demande en statut "en_cours"
 */
export async function validerDemandePotAction(
  input: ValiderDemandePotInput
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
    const result = await validateDemandePot(
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
    revalidatePath('/equipe');

    return { success: true };
  } catch (error) {
    console.error('Error in validerDemandePotAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

/**
 * Marque une demande comme payée (trésorier uniquement)
 * Débite définitivement le pot d'équipe
 */
export async function marquerPayeePotAction(
  input: MarquerPayeePotInput
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
    const result = await markDemandePotPaid(
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
    revalidatePath('/equipe');

    return { success: true };
  } catch (error) {
    console.error('Error in marquerPayeePotAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}

/**
 * Rejette une demande de pot d'équipe (trésorier uniquement)
 * Ne débite pas le pot d'équipe
 */
export async function rejeterDemandePotAction(
  input: RejeterDemandePotInput
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
    const result = await rejectDemandePot(
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
    revalidatePath('/equipe');

    return { success: true };
  } catch (error) {
    console.error('Error in rejeterDemandePotAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur est survenue",
    };
  }
}
