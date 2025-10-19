import { createAdminClient } from '@/lib/supabase/admin'

export default async function ReceiptPage({ searchParams, params }: { params: Promise<{ receiptNumber: string }>, searchParams?: { t?: string } }) {
  const admin = createAdminClient()
  const { receiptNumber } = await params
  const token = searchParams?.t

  // Validate token and load receipt + transaction summary
  const { data: receipt } = await admin
    .from('receipts')
    .select('id, receipt_number, receipt_type, pdf_url, public_access_token, transaction_id')
    .eq('receipt_number', receiptNumber)
    .single()

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold">Reçu introuvable</h1>
        </div>
      </div>
    )
  }

  if (!token || token !== receipt.public_access_token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Accès protégé</h1>
          <p className="text-gray-600">Le lien que vous avez utilisé est incomplet ou expiré. Veuillez utiliser le bouton &quot;Télécharger mon reçu&quot; depuis l&apos;email reçu.</p>
        </div>
      </div>
    )
  }

  const { data: tx } = await admin
    .from('support_transactions')
    .select('amount, supporter_name, supporter_email, receipt_number')
    .eq('id', receipt.transaction_id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-semibold mb-2">Reçu {receipt.receipt_type === 'fiscal' ? 'fiscal' : 'de soutien'}</h1>
          <p className="text-sm text-gray-500 mb-6">N° {receipt.receipt_number}</p>

          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Montant:</span> {tx?.amount}€</p>
            {tx?.supporter_name && <p><span className="font-medium">Nom:</span> {tx?.supporter_name}</p>}
            {tx?.supporter_email && <p><span className="font-medium">Email:</span> {tx?.supporter_email}</p>}
          </div>

          {receipt.pdf_url ? (
            <div className="mt-6">
              <a href={receipt.pdf_url} target="_blank" className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700">📄 Ouvrir le PDF</a>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
              Le PDF n&apos;est pas encore disponible. Réessayez plus tard, ou contactez l&apos;association si cela persiste.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
