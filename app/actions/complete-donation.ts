"use server"

// Legacy deferred-donor-completion flow has been removed.
// Keep a stub with the old signature to avoid breaking imports/usages during cleanup.
export async function completeDonation(_data: {
  token: string
  firstName: string
  lastName: string
  email: string
  addressLine1?: string
  postalCode: string
  city: string
}): Promise<{ success: false; error: string }> {
  void _data
  return { success: false, error: 'Flux de finalisation différée retiré' }
}
