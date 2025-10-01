import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = Record<string, string | string[] | undefined>

export default async function SuccessPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  // Next's generated types may declare searchParams as a Promise; awaiting is safe even if it's a plain object.
  const params: SearchParams = (await searchParams) ?? {}

  const rawIntent = params.intent
  const intentId = Array.isArray(rawIntent) ? rawIntent[0] : rawIntent

  if (!intentId) {
    redirect('/')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  try {
    // 1) Vérifier l'intention en attente
    const { data: intent, error: intentError } = await supabase
      .from('donation_intents')
      .select('*')
      .eq('id', intentId)
      .in('status', ['waiting_donor', 'completed'])
      .single()

    if (intentError || !intent) {
      console.error('[success] Intention non trouvée ou déjà traitée:', intentError)
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
            <h1 className="text-xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-gray-700">Cette intention de don n&apos;est plus valide.</p>
          </div>
        </div>
      )
    }

    // 2) Si déjà complétée et transaction déjà liée, sauter la création
    if (intent.status === 'completed' && intent.support_transaction_id) {
      console.log(`[success] Intention déjà complétée avec transaction ${intent.support_transaction_id}`)
      return renderSuccess()
    }

    // 2bis) Marquer l'intention comme complétée (protection contre les courses)
    const { error: updateError } = await supabase
      .from('donation_intents')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', intentId)
      .eq('status', 'waiting_donor')

    if (updateError) {
      console.error('[success] Erreur mise à jour de l\'intention:', updateError)
    }

    // 3) Créer la transaction de support (si pas déjà créée)
    const supporterName = `${intent.donor_first_name || ''} ${intent.donor_last_name || ''}`.trim() || null
    const amount = intent.final_amount ?? intent.expected_amount

    const { data: transaction, error: transactionError } = await supabase
      .from('support_transactions')
      .insert({
        user_id: intent.sapeur_pompier_id,
        tournee_id: intent.tournee_id,
        amount,
        calendar_accepted: !intent.fiscal_receipt,
        supporter_name: supporterName,
        supporter_email: intent.donor_email,
        payment_method: 'carte',
        payment_status: 'completed',
        notes: 'Paiement HelloAsso - Confirmation retour',
        consent_email: true,
      })
      .select()
      .single()

    if (transactionError) {
      console.error('[success] Erreur lors de la création de la transaction:', transactionError)
    } else if (transaction?.id) {
      await supabase
        .from('donation_intents')
        .update({ support_transaction_id: transaction.id })
        .eq('id', intentId)
    }

    console.log(`[success] Don traité avec succès pour l\'intention ${intentId}`)
  } catch (error) {
    console.error('[success] Erreur inattendue:', error)
  }

  // 4) Toujours afficher la confirmation (même si la DB a échoué)
  return renderSuccess()
}

function renderSuccess() {
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

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Un reçu de votre don vous sera envoyé par email si vous avez fourni votre adresse.
          </p>
        </div>
      </div>
    </div>
  )
}
