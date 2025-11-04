/**
 * Configuration centralisée de l'application
 * Toutes les valeurs par défaut et constantes métier
 */

// ============================
// RÉTRIBUTION & POT D'ÉQUIPE
// ============================

export const RETRIBUTION_CONFIG = {
  /**
   * Pourcentage minimum obligatoire au pot d'équipe
   * Peut être redéfini par équipe
   */
  MINIMUM_POT_EQUIPE_DEFAULT: 0,

  /**
   * Pourcentage recommandé au pot d'équipe
   * Utilisé si l'équipe n'a pas défini de recommandation
   */
  RECOMMANDE_POT_EQUIPE_DEFAULT: 30,

  /**
   * Pourcentage maximum autorisé au pot d'équipe
   */
  MAXIMUM_POT_EQUIPE: 100,

  /**
   * Part de rétribution versée par l'amicale (en %)
   * Exemple: 30% du prix de vente du calendrier
   */
  POURCENTAGE_RETRIBUTION_AMICALE: 30,
} as const;

// ============================
// CALENDRIERS
// ============================

export const CALENDRIER_CONFIG = {
  /**
   * Objectif par défaut si non calculable depuis la progression
   * Utilisé comme fallback dans les graphiques
   */
  OBJECTIF_DEFAULT_CALENDRIERS: 50,

  /**
   * Prix de vente standard d'un calendrier (en €)
   */
  PRIX_CALENDRIER: 10,

  /**
   * Nombre de calendriers alloués par défaut à une nouvelle équipe
   */
  ALLOCATION_INITIALE_EQUIPE: 100,
} as const;

// ============================
// PAGINATION & LIMITES
// ============================

export const PAGINATION_CONFIG = {
  /**
   * Nombre d'items par page par défaut
   */
  ITEMS_PER_PAGE_DEFAULT: 20,

  /**
   * Nombre d'items dans les listings courts (historique, etc.)
   */
  ITEMS_SHORT_LIST: 5,

  /**
   * Nombre maximum d'items à charger
   */
  MAX_ITEMS_LOAD: 100,

  /**
   * Nombre de mouvements de rétribution à afficher
   */
  MOUVEMENTS_RETRIBUTION_LIMIT: 5,

  /**
   * Nombre d'historique de tournées à afficher
   */
  HISTORIQUE_TOURNEES_LIMIT: 3,
} as const;

// ============================
// COMPTEURS & STATISTIQUES
// ============================

export const STATS_CONFIG = {
  /**
   * Valeur par défaut pour les compteurs (0)
   */
  COUNTER_DEFAULT: 0,

  /**
   * Montant par défaut pour les statistiques monétaires
   */
  AMOUNT_DEFAULT: 0,

  /**
   * Progression par défaut (0%)
   */
  PROGRESSION_DEFAULT: 0,
} as const;

// ============================
// GALERIE
// ============================

export const GALERIE_CONFIG = {
  /**
   * Nombre de photos à afficher par page
   */
  PHOTOS_PER_PAGE: 48,

  /**
   * Taille maximale d'upload (en Mo)
   */
  MAX_FILE_SIZE_MB: 10,

  /**
   * Formats acceptés
   */
  ACCEPTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

// ============================
// ANNONCES
// ============================

export const ANNONCES_CONFIG = {
  /**
   * Nombre d'annonces par page
   */
  ANNONCES_PER_PAGE: 20,

  /**
   * Durée de validité par défaut (en jours)
   */
  DUREE_VALIDITE_DEFAULT: 30,

  /**
   * Prix minimum autorisé
   */
  PRIX_MINIMUM: 0,

  /**
   * Prix maximum recommandé
   */
  PRIX_MAXIMUM_RECOMMANDE: 10000,
} as const;

// ============================
// IDÉES
// ============================

export const IDEES_CONFIG = {
  /**
   * Durée maximale d'enregistrement audio (en secondes)
   */
  MAX_AUDIO_DURATION_SECONDS: 180,

  /**
   * Nombre d'idées par page
   */
  IDEES_PER_PAGE: 20,

  /**
   * Nombre minimum de caractères pour une description
   */
  MIN_DESCRIPTION_LENGTH: 10,

  /**
   * Nombre maximum de tags par idée
   */
  MAX_TAGS_PER_IDEA: 5,
} as const;

// ============================
// RÔLES & PERMISSIONS
// ============================

export const ROLES_CONFIG = {
  /**
   * Rôle par défaut pour un nouvel utilisateur
   */
  DEFAULT_ROLE: 'membre' as const,

  /**
   * Rôles avec accès admin
   */
  ADMIN_ROLES: ['admin', 'chef'] as const,

  /**
   * Rôles pouvant gérer une équipe
   */
  TEAM_MANAGER_ROLES: ['admin', 'chef'] as const,
} as const;

// ============================
// UTILITAIRES
// ============================

/**
 * Vérifie si un rôle a des permissions admin
 */
export function isAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  return (ROLES_CONFIG.ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Vérifie si un rôle peut gérer une équipe
 */
export function canManageTeam(role: string | undefined): boolean {
  if (!role) return false;
  return (ROLES_CONFIG.TEAM_MANAGER_ROLES as readonly string[]).includes(role);
}
