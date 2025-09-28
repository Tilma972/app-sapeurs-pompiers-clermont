import { Check } from 'lucide-react'

export default function DonationSuccess() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-green-800 mb-2">Merci pour votre don !</h1>
        <p className="text-gray-600 mb-4">Votre paiement a été confirmé. Le sapeur-pompier en sera notifié immédiatement.</p>
        <p className="text-sm text-gray-500">Un reçu vous sera envoyé par email si vous l&apos;avez demandé.</p>
      </div>
    </div>
  )
}
