/**
 * Utilitaires de compression d'images côté client
 * Ces fonctions utilisent les APIs du navigateur (Image, Canvas)
 */

/**
 * Compresse une image avant upload
 * @param file - Le fichier image à compresser
 * @param maxWidth - Largeur maximale en pixels (défaut: 1200)
 * @param quality - Qualité JPEG de 0 à 1 (défaut: 0.85)
 * @returns Promise<File> - Le fichier compressé
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<File> {
  // Vérifier que c'est bien une image
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Redimensionner si l'image est trop large
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'))
          return
        }

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height)

        // Convertir en blob JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Créer un nouveau fichier avec le blob compressé
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Échec de la compression'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
    }
    
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compresse plusieurs images en parallèle
 * @param files - Array de fichiers à compresser
 * @param maxWidth - Largeur maximale
 * @param quality - Qualité JPEG
 * @returns Promise<File[]> - Array des fichiers compressés
 */
export async function compressImages(
  files: File[],
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<File[]> {
  return Promise.all(
    files.map(file => compressImage(file, maxWidth, quality))
  )
}

/**
 * Obtient les dimensions d'une image
 * @param file - Le fichier image
 * @returns Promise<{width: number, height: number}>
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
    }
    
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
    reader.readAsDataURL(file)
  })
}
