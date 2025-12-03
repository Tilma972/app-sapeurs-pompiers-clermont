// ============================================
// Server Actions - Matériel & Emprunts
// Module Vie de Caserne
// ============================================

'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { 
  CreateMaterialInput, 
  RequestLoanInput,
  ActionResult, 
  MaterialWithLoans 
} from '../types'

/**
 * Récupère l'utilisateur connecté
 */
async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Non authentifié')
  }
  return user
}

/**
 * Ajouter un nouveau matériel à l'inventaire
 */
export async function createMaterial(
  input: CreateMaterialInput
): Promise<ActionResult<MaterialWithLoans>> {
  try {
    await getCurrentUser()

    const material = await prisma.material.create({
      data: {
        name: input.name,
        description: input.description,
        inventoryNumber: input.inventoryNumber,
        condition: input.condition,
        photoUrl: input.photoUrl,
        isAvailable: true,
      },
      include: {
        loans: true,
      }
    })

    revalidatePath('/dashboard/vie-caserne/materiel')
    return { success: true, data: material }
  } catch (error) {
    console.error('Erreur création matériel:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Récupérer tout le matériel avec statut de disponibilité
 */
export async function getAllMaterials(): Promise<MaterialWithLoans[]> {
  const materials = await prisma.material.findMany({
    include: {
      loans: {
        where: {
          status: { in: ['APPROVED', 'ACTIVE'] },
          endDate: { gte: new Date() }
        },
        orderBy: { startDate: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  })

  return materials.map(m => ({
    ...m,
    currentLoan: m.loans.find(l => 
      l.status === 'ACTIVE' || 
      (l.status === 'APPROVED' && new Date(l.startDate) <= new Date())
    ) || null
  }))
}

/**
 * Récupérer le matériel disponible pour une période
 */
export async function getAvailableMaterials(
  startDate: Date,
  endDate: Date
): Promise<MaterialWithLoans[]> {
  // Récupérer les matériels qui n'ont pas de prêt actif sur la période
  const materials = await prisma.material.findMany({
    where: {
      isAvailable: true,
      condition: { not: 'BROKEN' },
    },
    include: {
      loans: {
        where: {
          status: { in: ['APPROVED', 'ACTIVE'] },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          ]
        }
      }
    }
  })

  // Filtrer ceux qui n'ont pas de conflit
  return materials
    .filter(m => m.loans.length === 0)
    .map(m => ({ ...m, currentLoan: null }))
}

/**
 * Demander un emprunt de matériel
 */
export async function requestLoan(
  input: RequestLoanInput
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser()

    // Vérifier que le matériel existe et est disponible
    const material = await prisma.material.findUnique({
      where: { id: input.materialId }
    })

    if (!material) {
      return { success: false, error: 'Matériel non trouvé' }
    }

    if (!material.isAvailable || material.condition === 'BROKEN') {
      return { success: false, error: 'Matériel non disponible' }
    }

    // Vérifier qu'il n'y a pas de conflit avec un autre prêt
    const conflictingLoan = await prisma.loan.findFirst({
      where: {
        materialId: input.materialId,
        status: { in: ['APPROVED', 'ACTIVE'] },
        startDate: { lte: input.endDate },
        endDate: { gte: input.startDate }
      }
    })

    if (conflictingLoan) {
      return { success: false, error: 'Le matériel est déjà réservé pour cette période' }
    }

    // Créer la demande de prêt
    await prisma.loan.create({
      data: {
        materialId: input.materialId,
        userId: user.id,
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'PENDING',
      }
    })

    revalidatePath('/dashboard/vie-caserne/materiel')
    return { success: true }
  } catch (error) {
    console.error('Erreur demande emprunt:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Approuver un emprunt (admin/bureau)
 */
export async function approveLoan(loanId: string): Promise<ActionResult> {
  try {
    await getCurrentUser()

    const loan = await prisma.loan.findUnique({
      where: { id: loanId }
    })

    if (!loan) {
      return { success: false, error: 'Emprunt non trouvé' }
    }

    if (loan.status !== 'PENDING') {
      return { success: false, error: 'Cet emprunt a déjà été traité' }
    }

    await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'APPROVED' }
    })

    revalidatePath('/dashboard/vie-caserne/materiel')
    return { success: true }
  } catch (error) {
    console.error('Erreur approbation emprunt:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Marquer un emprunt comme actif (matériel récupéré)
 */
export async function activateLoan(loanId: string): Promise<ActionResult> {
  try {
    await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'ACTIVE' }
    })

    revalidatePath('/dashboard/vie-caserne/materiel')
    return { success: true }
  } catch (error) {
    console.error('Erreur activation emprunt:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Marquer un emprunt comme retourné
 */
export async function returnLoan(
  loanId: string,
  newCondition?: 'NEW' | 'GOOD' | 'USED' | 'DAMAGED' | 'BROKEN'
): Promise<ActionResult> {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId }
    })

    if (!loan) {
      return { success: false, error: 'Emprunt non trouvé' }
    }

    // Mettre à jour le prêt
    await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'RETURNED' }
    })

    // Mettre à jour l'état du matériel si spécifié
    if (newCondition) {
      await prisma.material.update({
        where: { id: loan.materialId },
        data: { 
          condition: newCondition,
          isAvailable: newCondition !== 'BROKEN'
        }
      })
    }

    revalidatePath('/dashboard/vie-caserne/materiel')
    return { success: true }
  } catch (error) {
    console.error('Erreur retour emprunt:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    }
  }
}

/**
 * Récupérer mes emprunts
 */
export async function getMyLoans() {
  const user = await getCurrentUser()

  return prisma.loan.findMany({
    where: { userId: user.id },
    include: {
      material: true,
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Récupérer les emprunts en attente (pour admin)
 */
export async function getPendingLoans() {
  return prisma.loan.findMany({
    where: { status: 'PENDING' },
    include: {
      material: true,
    },
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * Récupérer le calendrier des emprunts pour un matériel
 */
export async function getMaterialCalendar(materialId: string) {
  return prisma.loan.findMany({
    where: {
      materialId,
      status: { in: ['APPROVED', 'ACTIVE'] },
      endDate: { gte: new Date() }
    },
    orderBy: { startDate: 'asc' }
  })
}

/**
 * Statistiques du matériel
 */
export async function getMaterialStats() {
  const [total, available, activeLoans, pendingLoans] = await Promise.all([
    prisma.material.count(),
    prisma.material.count({ 
      where: { 
        isAvailable: true, 
        condition: { not: 'BROKEN' } 
      } 
    }),
    prisma.loan.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({ where: { status: 'PENDING' } })
  ])

  return { total, available, activeLoans, pendingLoans }
}
