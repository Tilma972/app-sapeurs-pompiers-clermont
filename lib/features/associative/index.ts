// ============================================
// Module Vie de Caserne - Exports
// ============================================

// Types
export * from './types'

// Actions - Événements
export {
  createEvent,
  getEvents,
  getEventById,
  updateParticipation,
  cancelEvent,
  getMyUpcomingEvents,
  getEventsStats,
} from './actions/events'

// Actions - Cagnottes
export {
  createMoneyPot,
  getActiveMoneyPots,
  getMoneyPotById,
  contributeToPot,
  confirmContribution,
  cancelContribution,
  closeMoneyPot,
  getMyContributions,
  getMoneyPotsStats,
} from './actions/money-pots'

// Actions - Matériel
export {
  createMaterial,
  getAllMaterials,
  getAvailableMaterials,
  requestLoan,
  approveLoan,
  activateLoan,
  returnLoan,
  getMyLoans,
  getPendingLoans,
  getMaterialCalendar,
  getMaterialStats,
} from './actions/materials'

// Actions - Sondages
export {
  createPoll,
  getActivePolls,
  getPollById,
  getPollResults,
  vote,
  removeVote,
  hasUserVoted,
  createDatePoll,
  closePoll,
  deletePoll,
  getPollsStats,
} from './actions/polls'
