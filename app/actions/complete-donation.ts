"use server"

// Legacy deferred-donor-completion flow has been removed.
// Keep a stub to prevent accidental usage; always returns a clear error.
export async function completeDonation() {
  return { success: false, error: 'Flux de finalisation différée retiré' }
}
