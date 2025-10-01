import { createLogger } from '@/lib/log'

const log = createLogger('helloasso/client')

export interface HelloAssoCheckoutIntent {
  id: string
  url: string
  expirationDate: string
}

export interface CreateCheckoutRequest {
  totalAmount: number
  initialAmount?: number
  itemName: string
  backUrl: string
  errorUrl: string
  returnUrl: string
  containsDonation: boolean
  metadata: Record<string, string>
  payer: {
    firstName: string
    lastName: string
    email: string
  }
}

class HelloAssoClient {
  private baseUrl: string
  private clientId: string
  private clientSecret: string
  private organizationSlug: string

  constructor() {
    // Base URL doit être l'hôte racine (sans /v5). Les endpoints ajouteront /v5 lorsque nécessaire.
    this.baseUrl = process.env.HELLOASSO_BASE_URL || 'https://api.helloasso.com'
    this.clientId = process.env.HELLOASSO_CLIENT_ID as string
    this.clientSecret = process.env.HELLOASSO_CLIENT_SECRET as string
    this.organizationSlug = process.env.HELLOASSO_ORGANIZATION_SLUG as string
  }

  async getAccessToken(): Promise<string> {
  const tokenUrl = `${this.baseUrl}/oauth2/token`
  const oauthScope = process.env.HELLOASSO_SCOPE // Optionnel: ex. "api" ou "all" selon configuration HelloAsso
  
  log.info('Tentative auth HelloAsso', { 
    tokenUrl, 
    baseUrl: this.baseUrl,
    isSandbox: this.baseUrl.includes('sandbox'),
    hasClientId: !!this.clientId,
    hasClientSecret: !!this.clientSecret,
    hasScope: Boolean(oauthScope),
  })

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: this.clientId,
    client_secret: this.clientSecret,
  })
  if (oauthScope) params.set('scope', oauthScope)

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  
  if (!response.ok) {
    const errorBody = await response.text()
    log.error('Échec authentification HelloAsso', { 
      status: response.status,
      errorBody  // Ajoute le corps de l'erreur
    })
    throw new Error('HelloAsso authentication failed')
  }
  
  const data = await response.json()
  return data.access_token
}

  async createCheckoutIntent(request: CreateCheckoutRequest): Promise<HelloAssoCheckoutIntent> {
    const token = await this.getAccessToken()
    // HelloAsso requiert initialAmount: s'il est absent, on le renseigne avec totalAmount
    const payload: CreateCheckoutRequest = {
      ...request,
      initialAmount: request.initialAmount ?? request.totalAmount,
    }
    const endpoint = `${this.baseUrl}/v5/organizations/${this.organizationSlug}/checkout-intents`
    log.info('Création checkout intent HelloAsso', {
      endpoint,
      organizationSlug: this.organizationSlug,
      hasToken: Boolean(token),
      totalAmount: payload.totalAmount,
      initialAmount: payload.initialAmount,
      containsDonation: payload.containsDonation,
    })
    const response = await fetch(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    if (!response.ok) {
      const errorText = await response.text()
      log.error('Échec création checkout intent', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        organizationSlug: this.organizationSlug,
        error: errorText,
      })
      throw new Error('Failed to create checkout intent')
    }
    const data = await response.json()
    return { id: data.id, url: data.redirectUrl, expirationDate: data.expirationDate }
  }
}

export const helloAssoClient = new HelloAssoClient()
