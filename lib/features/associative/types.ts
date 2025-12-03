// ============================================
// Types & Interfaces - Module Vie de Caserne
// ============================================

import type { 
  Event, 
  EventParticipant, 
  MoneyPot, 
  Contribution, 
  Material, 
  Loan, 
  Poll, 
  PollVote 
} from '@prisma/client'

// Re-export des types Prisma
export type {
  Event,
  EventParticipant,
  MoneyPot,
  Contribution,
  Material,
  Loan,
  Poll,
  PollVote,
}

// Enums (déjà dans Prisma, mais utiles côté client)
export const EventTypeLabels = {
  AG: 'Assemblée Générale',
  SAINTE_BARBE: 'Sainte-Barbe',
  REPAS_GARDE: 'Repas de Garde',
  SPORT: 'Activité Sportive',
  AUTRE: 'Autre',
} as const

export const EventStatusLabels = {
  DRAFT: 'Brouillon',
  PLANNED: 'Planifié',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
} as const

export const ParticipationStatusLabels = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  ASTREINTE: 'Astreinte',
} as const

export const PotStatusLabels = {
  ACTIVE: 'En cours',
  CLOSED: 'Clôturée',
  COMPLETED: 'Objectif atteint',
} as const

export const MaterialConditionLabels = {
  NEW: 'Neuf',
  GOOD: 'Bon état',
  USED: 'Usagé',
  DAMAGED: 'Endommagé',
  BROKEN: 'Hors service',
} as const

export const LoanStatusLabels = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  ACTIVE: 'En cours',
  RETURNED: 'Rendu',
  OVERDUE: 'En retard',
} as const

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
  type: 'AG' | 'SAINTE_BARBE' | 'REPAS_GARDE' | 'SPORT' | 'AUTRE'
  maxParticipants?: number
  createMoneyPot?: boolean
  moneyPotTitle?: string
  moneyPotTarget?: number
}

export interface UpdateParticipationInput {
  eventId: string
  status: 'PRESENT' | 'ABSENT' | 'ASTREINTE'
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
  condition: 'NEW' | 'GOOD' | 'USED' | 'DAMAGED' | 'BROKEN'
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
