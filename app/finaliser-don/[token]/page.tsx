import { createClient } from '@/lib/supabase/server'
import { DonorCompletionForm } from '@/components/donor-completion-form'

export default async function CompleteDonationPage({ params }: { params: { token: string } }) {
  const supabase = await createClient()

  const { data: tokenData } = await supabase
    .from('donor_completion_tokens')
    .select(`*, transaction:support_transactions(*)`)
    .eq('token', params.token)
    .single()

  if (!tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lien invalide</h1>
          <p className="text-gray-600">Ce lien de finalisation n&apos;existe pas ou a déjà été utilisé.</p>
        </div>
      </div>
    )
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏱️</div>
          <h1 className="text-2xl font-bold text-orange-600 mb-4">Lien expiré</h1>
          <p className="text-gray-600">Ce lien a expiré (validité 48h). Veuillez contacter l&apos;association.</p>
        </div>
      </div>
    )
  }

  if (tokenData.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Don déjà finalisé</h1>
          <p className="text-gray-600">Votre reçu fiscal a déjà été envoyé par email.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <DonorCompletionForm token={params.token} transaction={tokenData.transaction} />
      </div>
    </div>
  )
}
