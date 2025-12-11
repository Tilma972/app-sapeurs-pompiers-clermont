// ============================================
// Server Actions - Matériel & Emprunts
// Module Vie de Caserne
// ============================================

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  CreateMaterialInput,
  RequestLoanInput,
  ActionResult,
  MaterialWithLoans,
  Material,
  Loan
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

// Helpers
function mapMaterialDates(m: any): Material {
  return {
    ...m,
    createdAt: new Date(m.createdAt),
    updatedAt: new Date(m.updatedAt),
  }
}

function mapLoanDates(l: any): Loan {
  return {
    ...l,
    startDate: new Date(l.startDate),
    endDate: new Date(l.endDate),
    createdAt: new Date(l.createdAt),
    updatedAt: new Date(l.updatedAt),
  }
}

/**
 * Ajouter un nouveau matériel à l'inventaire
 */
export async function createMaterial(
  input: CreateMaterialInput
): Promise<ActionResult<MaterialWithLoans>> {
  const supabase = await createClient()
  try {
    await getCurrentUser()

    const { data: material, error } = await supabase
      .from('associative_materials')
      .insert({
        name: input.name,
        description: input.description,
        inventoryNumber: input.inventoryNumber,
        condition: input.condition,
        photoUrl: input.photoUrl,
        isAvailable: true,
      })
      .select()
      .single()

    if (error || !material) throw new Error(error?.message || 'Erreur création matériel')

    const result: MaterialWithLoans = {
      ...mapMaterialDates(material),
      loans: [],
      currentLoan: null
    }

    revalidatePath('/associative')
    return { success: true, data: result }
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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('associative_materials')
    .select(`
      *,
      loans:associative_loans(*)
    `)
    .order('name', { ascending: true })

  if (error || !data) return []

  return data.map((m: any) => {
    // Filtrer et trier les prêts pertinents
    const loans = (m.loans || [])
      .filter((l: any) =>
        ['APPROVED', 'ACTIVE'].includes(l.status) &&
        new Date(l.endDate) >= new Date()
      )
      .map(mapLoanDates)
      .sort((a: Loan, b: Loan) => a.startDate.getTime() - b.startDate.getTime())

    return {
      ...mapMaterialDates(m),
      loans,
      currentLoan: loans.find((l: Loan) =>
        l.status === 'ACTIVE' ||
        (l.status === 'APPROVED' && l.startDate <= new Date())
      ) || null
    }
  })
}

/**
 * Récupérer le matériel disponible pour une période
 */
export async function getAvailableMaterials(
  startDate: Date,
  endDate: Date
): Promise<MaterialWithLoans[]> {
  const supabase = await createClient()

  // Récupérer les matériels qui n'ont pas de prêt actif sur la période
  // On récupère tout et on filtre en JS car la logique de chevauchement de dates est complexe en simple query Supabase sans RPC
  const { data, error } = await supabase
    .from('associative_materials')
    .select(`
      *,
      loans:associative_loans(*)
    `)
    .eq('isAvailable', true)
    .neq('condition', 'BROKEN')

  if (error || !data) return []

  const start = new Date(startDate)
  const end = new Date(endDate)

  return data
    .map((m: any) => ({
      ...mapMaterialDates(m),
      loans: (m.loans || []).map(mapLoanDates)
    }))
    .filter((m: MaterialWithLoans) => {
      const conflictingLoan = m.loans.find(l =>
        ['APPROVED', 'ACTIVE'].includes(l.status) &&
        (
          (l.startDate <= end && l.endDate >= start)
        )
      )
      return !conflictingLoan
    })
    .map((m: MaterialWithLoans) => ({ ...m, currentLoan: null }))
}

/**
 * Demander un emprunt de matériel
 */
export async function requestLoan(
  input: RequestLoanInput
): Promise<ActionResult> {
  const supabase = await createClient()
  try {
    const user = await getCurrentUser()

    // Vérifier que le matériel existe et est disponible
    const { data: material } = await supabase
      .from('associative_materials')
      .select('*')
      .eq('id', input.materialId)
      .single()

    if (!material) {
      return { success: false, error: 'Matériel non trouvé' }
    }

    if (!material.isAvailable || material.condition === 'BROKEN') {
      return { success: false, error: 'Matériel non disponible' }
    }

    // Vérifier qu'il n'y a pas de conflit avec un autre prêt
    // On utilise une requête pour vérifier le chevauchement
    const { data: conflicts } = await supabase
      .from('associative_loans')
      .select('id')
      .eq('materialId', input.materialId)
      .in('status', ['APPROVED', 'ACTIVE'])
      .lte('startDate', input.endDate.toISOString())
      .gte('endDate', input.startDate.toISOString())
      .limit(1)

    if (conflicts && conflicts.length > 0) {
      return { success: false, error: 'Le matériel est déjà réservé pour cette période' }
    }

    // Créer la demande de prêt
    const { error } = await supabase
      .from('associative_loans')
      .insert({
        materialId: input.materialId,
        userId: user.id,
        startDate: input.startDate.toISOString(),
        endDate: input.endDate.toISOString(),
        status: 'PENDING',
      })

    if (error) throw error

    revalidatePath('/associative')
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
  const supabase = await createClient()
  try {
    await getCurrentUser()

    const { data: loan } = await supabase
      .from('associative_loans')
      .select('status')
      .eq('id', loanId)
      .single()

    if (!loan) {
      return { success: false, error: 'Emprunt non trouvé' }
    }

    if (loan.status !== 'PENDING') {
      return { success: false, error: 'Cet emprunt a déjà été traité' }
    }

    const { error } = await supabase
      .from('associative_loans')
      .update({ status: 'APPROVED' })
      .eq('id', loanId)

    if (error) throw error

    revalidatePath('/associative')
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
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('associative_loans')
      .update({ status: 'ACTIVE' })
      .eq('id', loanId)

    if (error) throw error

    revalidatePath('/associative')
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
  const supabase = await createClient()
  try {
    const { data: loan } = await supabase
      .from('associative_loans')
      .select('materialId')
      .eq('id', loanId)
      .single()

    if (!loan) {
      return { success: false, error: 'Emprunt non trouvé' }
    }

    // Mettre à jour le prêt
    const { error: loanError } = await supabase
      .from('associative_loans')
      .update({ status: 'RETURNED' })
      .eq('id', loanId)

    if (loanError) throw loanError

    // Mettre à jour l'état du matériel si spécifié
    if (newCondition) {
      await supabase
        .from('associative_materials')
        .update({
          condition: newCondition,
          isAvailable: newCondition !== 'BROKEN'
        })
        .eq('id', loan.materialId)
    }

    revalidatePath('/associative')
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
  const supabase = await createClient()
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('associative_loans')
    .select(`
      *,
      material:associative_materials(*)
    `)
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })

  if (error || !data) return []

  return data.map((l: any) => ({
    ...mapLoanDates(l),
    material: mapMaterialDates(l.material)
  }))
}

/**
 * Récupérer les emprunts en attente (pour admin)
 */
export async function getPendingLoans() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('associative_loans')
    .select(`
      *,
      material:associative_materials(*)
    `)
    .eq('status', 'PENDING')
    .order('createdAt', { ascending: true })

  if (error || !data) return []

  return data.map((l: any) => ({
    ...mapLoanDates(l),
    material: mapMaterialDates(l.material)
  }))
}

/**
 * Récupérer le calendrier des emprunts pour un matériel
 */
export async function getMaterialCalendar(materialId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('associative_loans')
    .select('*')
    .eq('materialId', materialId)
    .in('status', ['APPROVED', 'ACTIVE'])
    .gte('endDate', new Date().toISOString())
    .order('startDate', { ascending: true })

  if (error || !data) return []

  return data.map(mapLoanDates)
}

/**
 * Statistiques du matériel
 */
export async function getMaterialStats() {
  const supabase = await createClient()

  const [total, available, activeLoans, pendingLoans] = await Promise.all([
    supabase.from('associative_materials').select('*', { count: 'exact', head: true }),
    supabase.from('associative_materials').select('*', { count: 'exact', head: true })
      .eq('isAvailable', true)
      .neq('condition', 'BROKEN'),
    supabase.from('associative_loans').select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
    supabase.from('associative_loans').select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING')
  ])

  return {
    total: total.count || 0,
    available: available.count || 0,
    activeLoans: activeLoans.count || 0,
    pendingLoans: pendingLoans.count || 0
  }
}
