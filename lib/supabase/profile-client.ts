"use client";

import { createClient } from "@/lib/supabase/client";
import { Profile, ProfileUpdate } from "@/lib/types/profile";

/**
 * Récupère le profil de l'utilisateur connecté (côté client)
 * Crée automatiquement le profil s'il n'existe pas
 */
export async function getCurrentUserProfileClient(): Promise<Profile | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Essayer de récupérer le profil existant
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Si le profil n'existe pas, le créer automatiquement
  if (error && error.code === 'PGRST116') {
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

  if (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return null;
  }

  return profile;
}

/**
 * Met à jour le profil de l'utilisateur connecté (côté client)
 */
export async function updateUserProfileClient(updates: ProfileUpdate): Promise<Profile | null> {
  const supabase = createClient();
  
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

