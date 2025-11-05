/**
 * Profile Identity Helpers
 * 
 * Utilitaires pour gérer la distinction entre:
 * - Nom d'affichage (pseudo) : display_name / full_name
 * - Identité réelle : first_name + last_name
 * - Statut de vérification : identity_verified
 */

export type Profile = {
  id: string;
  email?: string | null;
  
  // LEGACY - Compatibilité existante
  full_name?: string | null;
  
  // NOUVEAU - Système d'identité
  display_name?: string | null;      // Nom d'affichage (pseudo)
  first_name?: string | null;        // Prénom légal
  last_name?: string | null;         // Nom légal
  identity_verified?: boolean;       // Statut vérification
  verification_date?: string | null; // Date vérification
  verification_method?: string | null; // Méthode: 'admin', 'document', 'email', 'legacy'
  
  // Autres champs
  role?: string | null;
  is_active?: boolean;
  [key: string]: any;
}

/**
 * Obtient le nom à afficher (pseudo ou nom)
 * Priorité: display_name > full_name > first_name + last_name > "Utilisateur"
 */
export function getDisplayName(profile: Profile | null | undefined): string {
  if (!profile) return 'Utilisateur';
  
  return profile.display_name 
    || profile.full_name 
    || (profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : '')
    || 'Utilisateur';
}

/**
 * Obtient l'identité légale complète
 * Retourne null si l'identité n'est pas complète
 */
export function getLegalName(profile: Profile | null | undefined): string | null {
  if (!profile?.first_name || !profile?.last_name) {
    return null;
  }
  return `${profile.first_name} ${profile.last_name}`;
}

/**
 * Obtient les initiales du nom
 */
export function getInitials(profile: Profile | null | undefined): string {
  if (!profile) return 'U';
  
  const name = getDisplayName(profile);
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Vérifie si l'utilisateur a fourni son identité complète
 */
export function hasCompleteIdentity(profile: Profile | null | undefined): boolean {
  return Boolean(
    profile?.first_name && 
    profile?.last_name
  );
}

/**
 * Vérifie si l'identité est vérifiée par l'admin
 */
export function hasVerifiedIdentity(profile: Profile | null | undefined): boolean {
  return Boolean(
    profile?.first_name && 
    profile?.last_name && 
    profile?.identity_verified
  );
}

/**
 * Vérifie si l'utilisateur peut accéder aux offres partenaires
 * Requis: identité vérifiée + compte actif
 */
export function canAccessPartnerOffers(profile: Profile | null | undefined): boolean {
  return hasVerifiedIdentity(profile) && Boolean(profile?.is_active);
}

/**
 * Vérifie si l'utilisateur peut recevoir des documents officiels
 * Requis: identité vérifiée
 */
export function canReceiveOfficialDocuments(profile: Profile | null | undefined): boolean {
  return hasVerifiedIdentity(profile);
}

/**
 * Obtient un message expliquant pourquoi l'identité est requise
 */
export function getIdentityRequiredMessage(
  feature: 'partner_offers' | 'official_documents' | 'events' | 'general'
): string {
  const messages = {
    partner_offers: 'Votre identité réelle est nécessaire pour accéder aux offres partenaires.',
    official_documents: 'Votre identité réelle est nécessaire pour recevoir des documents officiels (reçus, cartes).',
    events: 'Votre identité réelle est nécessaire pour participer aux événements de l\'amicale.',
    general: 'Votre identité réelle est nécessaire pour accéder à cette fonctionnalité.',
  };
  
  return messages[feature];
}

/**
 * Obtient le statut de vérification formaté
 */
export function getVerificationStatus(profile: Profile | null | undefined): {
  status: 'none' | 'pending' | 'verified';
  label: string;
  icon: string;
  color: string;
} {
  if (!profile) {
    return { status: 'none', label: 'Non renseigné', icon: '❌', color: 'text-gray-500' };
  }
  
  if (hasVerifiedIdentity(profile)) {
    return { status: 'verified', label: 'Identité vérifiée', icon: '✓', color: 'text-green-600' };
  }
  
  if (hasCompleteIdentity(profile)) {
    return { status: 'pending', label: 'En attente de vérification', icon: '⏳', color: 'text-yellow-600' };
  }
  
  return { status: 'none', label: 'Identité non fournie', icon: '⚠️', color: 'text-orange-600' };
}

/**
 * Formatte la date de vérification
 */
export function formatVerificationDate(profile: Profile | null | undefined): string | null {
  if (!profile?.verification_date) return null;
  
  const date = new Date(profile.verification_date);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Obtient le label de la méthode de vérification
 */
export function getVerificationMethodLabel(method: string | null | undefined): string {
  const labels: Record<string, string> = {
    admin: 'Vérification manuelle',
    document: 'Pièce d\'identité',
    email: 'Confirmation email',
    legacy: 'Données migrées',
  };
  
  return labels[method || ''] || 'Non spécifié';
}

/**
 * Vérifie si le profil nécessite une complétion d'identité
 */
export function needsIdentityCompletion(
  profile: Profile | null | undefined,
  forFeature?: 'partner_offers' | 'official_documents'
): boolean {
  if (!profile) return false;
  
  // Si on demande pour une fonctionnalité spécifique, vérifier la vérification
  if (forFeature === 'partner_offers' || forFeature === 'official_documents') {
    return !hasVerifiedIdentity(profile);
  }
  
  // Sinon, juste vérifier si l'identité est complète
  return !hasCompleteIdentity(profile);
}
