import { createClient } from "@/lib/supabase/server";
import { Profile, ProfileUpdate } from "@/lib/types/profile";

/**
 * Récupère le profil de l'utilisateur connecté avec les données de l'équipe
 * Crée automatiquement le profil s'il n'existe pas
 * OPTIMISATION: Un seul query au lieu de 2 séquentiels (profile + equipe)
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // OPTIMISATION: Récupérer le profil avec les données de l'équipe en un seul query (JOIN)
  // Économie: ~50-100ms par page load
  // Utilisation de try/catch pour gérer les erreurs potentielles de JOIN (ambiguïté)
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        equipe:equipes!profiles_team_id_fkey(
          id,
          nom,
          secteur,
          calendriers_alloues
        )
      `)
      .eq('id', user.id)
      .single();

    if (!error && profile) {
      return profile;
    }
    
    // Si erreur PGRST116 (non trouvé), on laisse le code suivant gérer la création
    if (error && error.code !== 'PGRST116') {
      console.warn('Erreur JOIN profile/equipe, repli sur requête simple:', error.message);
      // Fallback vers la méthode séquentielle si le JOIN échoue
      throw error;
    }
    
    // Si PGRST116, on continue vers la création
    if (error && error.code === 'PGRST116') {
       // On laisse le flux continuer vers la création
    }
  } catch (e) {
    console.warn('Exception lors du JOIN profile/equipe:', e);
    // Fallback: Récupération séquentielle (plus robuste)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Continue to creation logic below
    } else if (error) {
      console.error('Erreur lors de la récupération du profil (fallback):', error);
      return null;
    } else if (profile) {
      // Si on a le profil, on essaie de récupérer l'équipe séparément
      if (profile.team_id) {
        const { data: team } = await supabase
          .from('equipes')
          .select('id, nom, secteur, calendriers_alloues')
          .eq('id', profile.team_id)
          .single();
        
        if (team) {
          return { ...profile, equipe: team };
        }
      }
      return profile;
    }
  }

  // Si le profil n'existe pas (confirmé par les tentatives précédentes), le créer automatiquement
  // Note: On refait une vérification simple pour être sûr avant de créer
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingProfile) {
    console.log('Profil non trouvé, création automatique...');

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
        role: 'membre'
      })
      .select()
      .single();

    if (createError) {
      console.error('Erreur lors de la création du profil:', createError);
      return null;
    }

    return newProfile;
  }

  return null; // Should not happen if logic is correct
}

/**
 * Met à jour le profil de l'utilisateur connecté
 */
export async function updateUserProfile(updates: ProfileUpdate): Promise<Profile | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return null;
  }

  return profile;
}

/**
 * Récupère tous les profils (pour l'administration)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return [];
  }

  return profiles || [];
}
