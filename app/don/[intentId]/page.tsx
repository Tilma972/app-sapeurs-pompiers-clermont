// app/don/[intentId]/page.tsx — Redirect immédiat vers HelloAsso
import { redirect, notFound } from 'next/navigation'
import { getDonationIntent } from '@/app/actions/donation-intent'
import { helloAssoClient } from '@/lib/helloasso/client'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

type Props = { params: Promise<{ intentId: string }> }

export default async function DonationRedirectPage({ params }: Props) {
  const { intentId } = await params

  // 1) Récupérer l'intention
  const intent = await getDonationIntent(intentId)
  if (!intent) return notFound()

  // 2) Vérifier expiration
  const isExpired = intent.status === 'expired' || (intent.expires_at && new Date(intent.expires_at) < new Date())
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">⏱️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Lien expiré</h1>
          <p className="text-gray-600">Ce lien a expiré. Veuillez demander un nouveau QR code.</p>
        </div>
      </div>
    )
  }

  // 3) Si on a déjà une URL checkout stockée, rediriger directement
  const checkoutUrl = (intent as { helloasso_checkout_url?: string | null }).helloasso_checkout_url
  if (checkoutUrl) {
    console.log(`[don/${intentId}] Reusing stored HelloAsso checkout URL → redirect`)
    redirect(checkoutUrl)
  }

  // 4) Créer un checkout HelloAsso (montant minimal 1€ techniquement requis)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL as string
  const donationName = "Don Sapeurs-Pompiers Clermont-l\'Hérault"

  let checkout: { id: string; url: string }
  try {
    console.log(`[don/${intentId}] Creating new HelloAsso checkout…`)
    checkout = await helloAssoClient.createCheckoutIntent({
      totalAmount: 100,
      initialAmount: 100,
      itemName: donationName,
      containsDonation: true,
      backUrl: `${siteUrl}/don/cancel?intent=${intentId}`,
      returnUrl: `${siteUrl}/don/success?intent=${intentId}`,
      errorUrl: `${siteUrl}/don/error?intent=${intentId}`,
      metadata: { intentId, tourneeId: intent.tournee_id },
      payer: {
        firstName: intent.donor_first_name || intent.donor_name_hint?.split(' ')[0] || '',
        lastName: intent.donor_last_name || intent.donor_name_hint?.split(' ').slice(1).join(' ') || '',
        email: intent.donor_email || '',
      },
    })
    console.log(`[don/${intentId}] HelloAsso checkout created`, { id: checkout.id })
  } catch (error) {
    console.error(`[don/${intentId}] HelloAsso checkout creation failed`, error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Service temporairement indisponible</h1>
          <p className="text-gray-600 mb-4">Un problème technique est survenu. Veuillez réessayer dans quelques instants.</p>
          <p className="text-sm text-gray-500 mb-4">Code d&apos;erreur : {intentId}</p>
          <a
            href={`/don/${intentId}`}
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </a>
        </div>
      </div>
    )
  }

  // 5) Stocker l'URL de checkout pour éviter recréation
  const admin = createAdminClient()
  await admin
    .from('donation_intents')
    .update({ helloasso_checkout_intent_id: checkout.id, helloasso_checkout_url: checkout.url })
    .eq('id', intentId)
  console.log(`[don/${intentId}] Stored checkout URL and id in DB → redirecting`)

  // 6) Redirection — ne pas encapsuler dans un try/catch
  redirect(checkout.url)
}