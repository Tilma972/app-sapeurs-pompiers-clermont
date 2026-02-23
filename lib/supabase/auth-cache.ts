/**
 * auth-cache.ts - Centralized authentication helpers with React.cache()
 * 
 * Déduplication des appels d'authentification par requête HTTP.
 * Après migration JWT Signing Keys → getClaims() devient 100% local (5-30ms).
 * 
 * Usage:
 * - const claims = await getCurrentUserClaims();
 * - const { user, profile } = await getUserWithProfile();
 * - const user = await getCurrentUser(); // fallback réseau
 */

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * Retourne les claims JWT de l'utilisateur via getClaims()
 * ✅ LOCAL (5-30ms) après migration JWT Signing Keys
 * 📦 Déduplicable via React.cache() = 1 appel unique par requête HTTP
 */
export const getCurrentUserClaims = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  return data.claims;
  // { sub: user_id, email, email_verified, phone, ... } // JWT claims standard
});

/**
 * Retourne l'utilisateur complet si getClaims() échoue
 * ⚠️ RÉSEAU (100-800ms) → Utiliser seulement si getClaims() ne suffit pas
 * 📦 Déduplicable via React.cache()
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
});

/**
 * Pattern RECOMMANDÉ: user claims + profile en une seule charge
 * Cas d'usage: Pages PWA, server actions qui besoin de user.id + role/profile
 * 
 * Return: { user, profile } ou { user: null, profile: null }
 * Perf: 1× getClaims() (local) + 1× DB query (parallèle)
 */
export const getUserWithProfile = cache(async () => {
  const claims = await getCurrentUserClaims();
  if (!claims?.sub) {
    return { user: null, profile: null };
  }

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      `id, 
       is_active, 
       first_name, 
       last_name, 
       full_name, 
       display_name,
       avatar_url, 
       role, 
       team_id,
       identity_verified,
       equipes:team_id(id, nom, numero, secteur)`
    )
    .eq('id', claims.sub)
    .single();

  if (error || !profile) {
    return {
      user: { id: claims.sub, email: claims.email },
      profile: null,
    };
  }

  return {
    user: {
      id: claims.sub,
      email: claims.email || '',
      phone: claims.phone || null,
    },
    profile,
  };
});

/**
 * Helper utilitaire: Vérifier rapidement l'authentification
 * Cas: redirect('login') si pas authentifié
 * Perf: getClaims() local uniquement
 */
export const assertAuthenticated = cache(async () => {
  const claims = await getCurrentUserClaims();
  if (!claims?.sub) {
    return null;
  }
  return claims.sub; // user_id
});

/**
 * Helper: Obtenez le user ID rapidement
 * Alias court pour claims.sub
 */
export const getCurrentUserId = cache(async () => {
  const claims = await getCurrentUserClaims();
  return claims?.sub || null;
});

/**
 * Helper: Vérifier le rôle rapidement (pour redirections admin, etc)
 * ⚠️ Requiert 1× DB query → considère cacher dans getUserWithProfile()
 */
export const getCurrentUserRole = cache(async () => {
  const { profile } = await getUserWithProfile();
  return profile?.role || null;
});

/**
 * Helper: Récupère juste le profile (ID requis)
 * Cas: Quand tu as déjà l'ID et besoin des données associées
 */
export async function getProfileById(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `id,
       is_active,
       first_name,
       last_name,
       full_name,
       display_name,
       avatar_url,
       role,
       team_id,
       identity_verified,
       equipes:team_id(id, nom)`
    )
    .eq('id', userId)
    .single();

  return data || null;
}
