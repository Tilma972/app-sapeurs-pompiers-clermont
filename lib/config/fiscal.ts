export const FISCAL_CONFIG = {
  CALENDAR_VALUE: 1.75,
  MAX_COUNTERPART_RATIO: 0.25, // 25%
  MAX_COUNTERPART_AMOUNT: 73,  // € (seuil 2024)
  TAX_DEDUCTION_RATE: 0.66,
  get MIN_DONATION_FOR_FISCAL() {
    return Math.ceil(this.CALENDAR_VALUE / this.MAX_COUNTERPART_RATIO)
  }
}

export function isFiscalEligible(amount: number, calendarGiven: boolean): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false
  if (!calendarGiven) return true
  const counterpartValue = FISCAL_CONFIG.CALENDAR_VALUE
  const admissible = Math.min(amount * FISCAL_CONFIG.MAX_COUNTERPART_RATIO, FISCAL_CONFIG.MAX_COUNTERPART_AMOUNT)
  return counterpartValue <= admissible
}

export function calculateTaxDeduction(amount: number, eligible: boolean): number {
  if (!eligible) return 0
  return Math.round(amount * FISCAL_CONFIG.TAX_DEDUCTION_RATE * 100) / 100
}
