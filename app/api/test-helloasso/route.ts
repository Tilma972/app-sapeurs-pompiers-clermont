// app/api/test-helloasso/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.HELLOASSO_CLIENT_ID
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET
  const baseUrl = process.env.HELLOASSO_BASE_URL || 'https://api.helloasso.com/v5'

  try {
    const response = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Pompiers34800/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    })

    const text = await response.text()
    
    return NextResponse.json({
      status: response.status,
      body: text,
      config: {
        url: `${baseUrl}/oauth2/token`,
        hasClientId: !!clientId,
        hasSecret: !!clientSecret,
        clientIdFirst5: clientId?.substring(0, 5),
        secretFirst5: clientSecret?.substring(0, 5)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}