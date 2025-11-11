/**
 * Utilitaires pour gérer les avatars utilisateurs
 */

/**
 * Construit l'URL complète d'un avatar depuis son chemin relatif Storage
 * @param avatarPath - Chemin relatif: "user_id/avatar.ext" ou null
 * @returns URL complète ou null
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null
  
  // Si déjà une URL complète (cas legacy), retourner telle quelle
  if (avatarPath.startsWith('http')) {
    return avatarPath
  }
  
  // Construire l'URL Supabase Storage publique
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL non défini')
    return null
  }
  
  return `${baseUrl}/storage/v1/object/public/avatars/${avatarPath}`
}

/**
 * Génère le chemin relatif Storage pour l'avatar d'un utilisateur
 * @param userId - UUID de l'utilisateur
 * @param fileExtension - Extension du fichier (jpg, png, webp)
 * @returns Chemin relatif: "user_id/avatar.ext"
 */
export function generateAvatarPath(userId: string, fileExtension: string): string {
  return `${userId}/avatar.${fileExtension}`
}

/**
 * Extrait l'extension d'un nom de fichier
 * @param filename - Nom du fichier avec extension
 * @returns Extension sans le point (jpg, png, etc.)
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || 'jpg'
}

/**
 * Valide qu'un fichier est une image supportée
 * @param file - Fichier à valider
 * @returns true si valide, sinon erreur
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    return { valid: false, error: "L'image ne doit pas dépasser 2MB" }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilisez JPG, PNG ou WEBP' }
  }

  return { valid: true }
}
