/**
 * Server Actions - Création/Modification Idées
 * Validation serveur + sécurité
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Types pour validation
interface CreateIdeaInput {
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  anonyme: boolean;
  audio_url?: string;
  audio_duration?: number;
  transcription?: string;
  status: "draft" | "published";
}

interface UpdateIdeaInput {
  title?: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  status?: "draft" | "published" | "archived";
}

// Catégories valides
const VALID_CATEGORIES = [
  "Équipement",
  "Formation",
  "Organisation",
  "Sécurité",
  "Communication",
  "Bien-être",
  "Innovation",
  "Autre",
];

/**
 * Créer une nouvelle idée (texte ou vocale)
 */
export async function createIdeaAction(data: CreateIdeaInput) {
  try {
    const supabase = await createClient();

    // 1. Vérifier authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Vous devez être connecté");
    }

    // 1.5. RATE LIMITING (Protection spam/abus)
    // Vérifier si l'utilisateur est admin (exempté de limite)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      // Rate limit : Max 10 idées par jour
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("ideas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .is("deleted_at", null);

      if (count && count >= 10) {
        throw new Error(
          "Limite de 10 idées par jour atteinte. Réessayez demain."
        );
      }

      // Rate limit spécifique pour idées vocales (plus coûteuses)
      if (data.audio_url) {
        const { count: voiceCount } = await supabase
          .from("ideas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00`)
          .not("audio_url", "is", null)
          .is("deleted_at", null);

        if (voiceCount && voiceCount >= 5) {
          throw new Error(
            "Limite de 5 idées vocales par jour atteinte. Utilisez le mode texte."
          );
        }
      }
    }

    // 2. VALIDATION SERVEUR (Security Critical)
    
    // Titre
    if (!data.title || data.title.trim().length < 3) {
      throw new Error("Le titre doit contenir au moins 3 caractères");
    }
    if (data.title.length > 200) {
      throw new Error("Le titre ne peut pas dépasser 200 caractères");
    }

    // Description
    if (!data.description || data.description.trim().length < 10) {
      throw new Error("La description doit contenir au moins 10 caractères");
    }
    if (data.description.length > 5000) {
      throw new Error("La description ne peut pas dépasser 5000 caractères");
    }

    // Catégories
    if (!data.categories || data.categories.length === 0) {
      throw new Error("Au moins une catégorie est requise");
    }
    if (data.categories.length > 3) {
      throw new Error("Maximum 3 catégories");
    }
    // Vérifier que toutes les catégories sont valides
    const invalidCategories = data.categories.filter(
      (cat) => !VALID_CATEGORIES.includes(cat)
    );
    if (invalidCategories.length > 0) {
      throw new Error(`Catégories invalides: ${invalidCategories.join(", ")}`);
    }

    // Tags
    if (data.tags.length > 10) {
      throw new Error("Maximum 10 tags");
    }
    // Valider chaque tag
    for (const tag of data.tags) {
      if (tag.length > 30) {
        throw new Error(`Tag trop long: "${tag}" (max 30 caractères)`);
      }
    }

    // Audio (si présent)
    if (data.audio_url) {
      if (!data.audio_url.startsWith("https://")) {
        throw new Error("URL audio invalide");
      }
      if (!data.audio_duration || data.audio_duration <= 0) {
        throw new Error("Durée audio invalide");
      }
      if (data.audio_duration > 600) {
        // 10 min max
        throw new Error("Audio trop long (max 10 minutes)");
      }
    }

    // 3. Sanitize les données (prevent XSS)
    const sanitizedData = {
      user_id: user.id,
      titre: data.title.trim(), // ✅ CORRECTION: "titre" (colonne DB en français)
      description: data.description.trim(),
      categories: data.categories,
      tags: data.tags.map((t) => t.trim()),
      anonyme: Boolean(data.anonyme),
      audio_url: data.audio_url || null,
      audio_duration: data.audio_duration || null,
      transcription: data.transcription?.trim() || null,
      status: data.status,
    };

    // 4. Insérer dans la base
    const { data: idea, error } = await supabase
      .from("ideas")
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      console.error("Erreur DB:", error);
      throw new Error("Erreur lors de la création de l'idée");
    }

    // 5. GAMIFICATION: Attribution d'XP pour publication d'idée
    if (data.status === 'published') {
      try {
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_amount: 50,
          p_reason: 'idee_postee',
          p_metadata: {
            idea_id: idea.id,
            title: data.title,
          },
        });

        // Vérifier et débloquer les badges
        await supabase.rpc('check_and_unlock_badges', {
          p_user_id: user.id,
        });
      } catch (gamificationError) {
        // Ne pas bloquer la création si la gamification échoue
        console.error('Erreur gamification (non-bloquante):', gamificationError);
      }
    }

    // 6. Revalider la page liste
    revalidatePath("/idees");

    return {
      success: true,
      ideaId: idea.id,
    };
  } catch (error) {
    console.error("Erreur createIdeaAction:", error);
    throw error;
  }
}

/**
 * Modifier une idée existante
 */
export async function updateIdeaAction(ideaId: string, data: UpdateIdeaInput) {
  try {
    const supabase = await createClient();

    // 1. Vérifier authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Vous devez être connecté");
    }

    // 2. Vérifier propriété de l'idée
    const { data: idea } = await supabase
      .from("ideas")
      .select("user_id")
      .eq("id", ideaId)
      .single();

    if (!idea || idea.user_id !== user.id) {
      throw new Error("Vous n'êtes pas autorisé à modifier cette idée");
    }

    // 3. VALIDATION SERVEUR
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      if (data.title.trim().length < 3 || data.title.length > 200) {
        throw new Error("Titre invalide (3-200 caractères)");
      }
      updateData.titre = data.title.trim(); // ✅ CORRECTION: "titre"
    }

    if (data.description !== undefined) {
      if (data.description.trim().length < 10 || data.description.length > 5000) {
        throw new Error("Description invalide (10-5000 caractères)");
      }
      updateData.description = data.description.trim();
    }

    if (data.categories !== undefined) {
      if (data.categories.length === 0 || data.categories.length > 3) {
        throw new Error("Catégories invalides (1-3 requises)");
      }
      const invalidCategories = data.categories.filter(
        (cat) => !VALID_CATEGORIES.includes(cat)
      );
      if (invalidCategories.length > 0) {
        throw new Error("Catégories invalides");
      }
      updateData.categories = data.categories;
    }

    if (data.tags !== undefined) {
      if (data.tags.length > 10) {
        throw new Error("Maximum 10 tags");
      }
      updateData.tags = data.tags.map((t) => t.trim());
    }

    if (data.status !== undefined) {
      if (!["draft", "published", "archived"].includes(data.status)) {
        throw new Error("Status invalide");
      }
      updateData.status = data.status;
    }

    // 4. Mettre à jour
    const { error } = await supabase
      .from("ideas")
      .update(updateData)
      .eq("id", ideaId);

    if (error) {
      console.error("Erreur update:", error);
      throw new Error("Erreur lors de la modification");
    }

    // 5. Revalider
    revalidatePath("/idees");
    revalidatePath(`/idees/${ideaId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur updateIdeaAction:", error);
    throw error;
  }
}

/**
 * Supprimer une idée (soft delete)
 */
export async function deleteIdeaAction(ideaId: string) {
  try {
    const supabase = await createClient();

    // 1. Vérifier authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Vous devez être connecté");
    }

    // 2. Vérifier permissions (propriétaire OU admin)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    const { data: idea } = await supabase
      .from("ideas")
      .select("user_id")
      .eq("id", ideaId)
      .single();

    if (!idea || (idea.user_id !== user.id && !isAdmin)) {
      throw new Error("Vous n'êtes pas autorisé à supprimer cette idée");
    }

    // 3. Soft delete
    const { error } = await supabase
      .from("ideas")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", ideaId);

    if (error) {
      console.error("Erreur delete:", error);
      throw new Error("Erreur lors de la suppression");
    }

    // 4. Revalider
    revalidatePath("/idees");

    return { success: true };
  } catch (error) {
    console.error("Erreur deleteIdeaAction:", error);
    throw error;
  }
}
