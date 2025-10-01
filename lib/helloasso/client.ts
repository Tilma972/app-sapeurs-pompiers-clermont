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
    this.baseUrl = process.env.HELLOASSO_BASE_URL || 'https://api.helloasso.com/v5'
    this.clientId = process.env.HELLOASSO_CLIENT_ID as string
    this.clientSecret = process.env.HELLOASSO_CLIENT_SECRET as string
    this.organizationSlug = process.env.HELLOASSO_ORGANIZATION_SLUG as string
  }

  async getAccessToken(): Promise<string> {
  const tokenUrl = `${this.baseUrl}/oauth2/token`
  
  // Ajoute ce log
  log.info('Tentative auth HelloAsso', { 
    tokenUrl, 
    hasClientId: !!this.clientId,
    hasClientSecret: !!this.clientSecret 
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }),
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
    const response = await fetch(
      `${this.baseUrl}/organizations/${this.organizationSlug}/checkout-intents`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    )
    if (!response.ok) {
      const errorText = await response.text()
      log.error('Échec création checkout intent', { status: response.status, error: errorText })
      throw new Error('Failed to create checkout intent')
    }
    const data = await response.json()
    return { id: data.id, url: data.redirectUrl, expirationDate: data.expirationDate }
  }
}

export const helloAssoClient = new HelloAssoClient()
