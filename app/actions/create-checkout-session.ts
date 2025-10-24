"use server"

// Backwards-compat shim: keep the same import path while migrating to PaymentIntent flow
export async function createCheckoutSession(data: {
  amount: number
  calendarGiven: boolean
  tourneeId: string
}) {
  const { createPaymentIntent } = await import("./create-payment-intent")
  return createPaymentIntent(data)
}
