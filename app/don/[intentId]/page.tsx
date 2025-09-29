import { notFound } from 'next/navigation'
import { getDonationIntent } from '@/app/actions/donation-intent'
import { DonorForm } from '@/components/donor-form'

type PageProps = { params: Promise<{ intentId: string }> }

export default async function DonationPage({ params }: PageProps) {
  const { intentId } = await params
  const intent = await getDonationIntent(intentId)
  if (!intent || intent.status !== 'waiting_donor') notFound()

  const sapeurPompierName = intent.tournees?.profiles?.full_name || 'Sapeur-Pompier'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-red-800 to-blue-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">SP</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Don aux Sapeurs-Pompiers</h1>
            <p className="text-gray-600">Clermont-l&apos;Hérault</p>
            <div className="mt-2 p-2 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">Collecteur : {sapeurPompierName}</p>
              <p className="text-sm text-blue-600">Zone : {intent.tournees?.zone}</p>
            </div>
          </div>

          <DonorForm intentId={intent.id} expectedAmount={intent.expected_amount} donorNameHint={intent.donor_name_hint} />

          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Paiement sécurisé via HelloAsso</p>
            <p>Association reconnue d&apos;utilité publique</p>
          </div>
        </div>
      </div>
    </div>
  )
}
