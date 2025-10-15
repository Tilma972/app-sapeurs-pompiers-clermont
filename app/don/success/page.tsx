import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = Record<string, string | string[] | undefined>

export default async function SuccessPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params: SearchParams = (await searchParams) ?? {}
  const intentId = Array.isArray(params.intent) ? params.intent[0] : params.intent

  if (!intentId) redirect('/')

  // Le webhook gère toute la persistance; cette page est purement présentative
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Merci pour votre don !</h1>
        <p className="text-gray-600 mb-6">
          Votre paiement a été traité avec succès. Les sapeurs-pompiers de Clermont-l&apos;Hérault vous remercient pour votre soutien.
        </p>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Un reçu de votre don vous sera envoyé par email si vous avez fourni votre adresse.
          </p>
        </div>
      </div>
    </div>
  )
}
