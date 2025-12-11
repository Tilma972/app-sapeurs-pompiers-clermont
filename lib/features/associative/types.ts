// ============================================
// Types & Interfaces - Module Vie de Caserne
// ============================================

// Enums
export type EventType = 'AG' | 'SAINTE_BARBE' | 'REPAS_GARDE' | 'SPORT' | 'AUTRE'
export type EventStatus = 'DRAFT' | 'PLANNED' | 'COMPLETED' | 'CANCELLED'
export type ParticipationStatus = 'PRESENT' | 'ABSENT' | 'ASTREINTE'
export type PotStatus = 'ACTIVE' | 'CLOSED' | 'COMPLETED'
export type ContributionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type MaterialCondition = 'NEW' | 'GOOD' | 'USED' | 'DAMAGED' | 'BROKEN'
export type LoanStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'RETURNED' | 'OVERDUE'

// Models
export interface Event {
  id: string
  title: string
  description: string | null
  date: Date
  location: string | null
  type: EventType
  status: EventStatus
  maxParticipants: number | null
  organizerId: string
  createdAt: Date
  updatedAt: Date
}

export interface EventParticipant {
  id: string
  eventId: string
  userId: string
  status: ParticipationStatus
  guests: number
  createdAt: Date
  updatedAt: Date
}

export interface MoneyPot {
  id: string
  title: string
  description: string | null
  targetAmount: number | null // Decimal in DB, number in JS
  eventId: string | null
  status: PotStatus
  createdAt: Date
  updatedAt: Date
}

export interface Contribution {
  id: string
  moneyPotId: string
  userId: string
  amount: number // Decimal in DB
  message: string | null
  isAnonymous: boolean
  stripePaymentId: string | null
  status: ContributionStatus
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  id: string
  name: string
  description: string | null
  inventoryNumber: string | null
  condition: MaterialCondition
  photoUrl: string | null
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Loan {
  id: string
  materialId: string
  userId: string
  startDate: Date
  endDate: Date
  status: LoanStatus
  createdAt: Date
  updatedAt: Date
}

export interface Poll {
  id: string
  question: string
  options: any // Json in DB
  eventId: string | null
  expiresAt: Date | null
  createdAt: Date
}

export interface PollVote {
  id: string
  pollId: string
  userId: string
  optionId: string
  createdAt: Date
}

// Labels
export const EventTypeLabels: Record<EventType, string> = {
  AG: 'Assemblée Générale',
  SAINTE_BARBE: 'Sainte-Barbe',
  REPAS_GARDE: 'Repas de Garde',
  SPORT: 'Activité Sportive',
  AUTRE: 'Autre',
}

export const EventStatusLabels: Record<EventStatus, string> = {
  DRAFT: 'Brouillon',
  PLANNED: 'Planifié',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

export const ParticipationStatusLabels: Record<ParticipationStatus, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  ASTREINTE: 'Astreinte',
}

export const PotStatusLabels: Record<PotStatus, string> = {
  ACTIVE: 'En cours',
  CLOSED: 'Clôturée',
  COMPLETED: 'Objectif atteint',
}

export const MaterialConditionLabels: Record<MaterialCondition, string> = {
  NEW: 'Neuf',
  GOOD: 'Bon état',
  USED: 'Usagé',
  DAMAGED: 'Endommagé',
  BROKEN: 'Hors service',
}

export const LoanStatusLabels: Record<LoanStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  ACTIVE: 'En cours',
  RETURNED: 'Rendu',
  OVERDUE: 'En retard',
}

// Types enrichis avec relations
export type EventWithDetails = Event & {
  participants: EventParticipant[]
  moneyPot: MoneyPot | null
  polls: Poll[]
  _count?: {
    participants: number
  }
}

export type MoneyPotWithDetails = MoneyPot & {
  event: Event | null
  contributions: Contribution[]
  _count?: {
    contributions: number
  }
  totalCollected?: number
}

export type MaterialWithLoans = Material & {
  loans: Loan[]
  currentLoan?: Loan | null
}

export type PollWithVotes = Poll & {
  event: Event | null
  votes: PollVote[]
  _count?: {
    votes: number
  }
}

// Types pour les formulaires
export interface CreateEventInput {
  title: string
  description?: string
  date: Date
  location?: string
  type: EventType
  maxParticipants?: number
  createMoneyPot?: boolean
  moneyPotTitle?: string
  moneyPotTarget?: number
}

export interface UpdateParticipationInput {
  eventId: string
  status: ParticipationStatus
  guests?: number
}

export interface CreateMoneyPotInput {
  title: string
  description?: string
  targetAmount?: number
  eventId?: string
}

export interface ContributeToPotInput {
  potId: string
  amount: number // en centimes
  message?: string
  isAnonymous?: boolean
}

export interface CreateMaterialInput {
  name: string
  description?: string
  inventoryNumber?: string
  condition: MaterialCondition
  photoUrl?: string
}

export interface RequestLoanInput {
  materialId: string
  startDate: Date
  endDate: Date
}

export interface CreatePollInput {
  question: string
  options: PollOption[]
  eventId?: string
  expiresAt?: Date
}

export interface PollOption {
  id: string
  label: string
}

export interface VoteInput {
  pollId: string
  optionId: string
}

// Types pour les réponses d'API
export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Types spécifiques pour Stripe
export interface ContributionPaymentResult {
  success: boolean
  clientSecret?: string
  contributionId?: string
  error?: string
}
