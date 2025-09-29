import { X } from 'lucide-react'

export default function DonationCancel() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-red-800 mb-2">Paiement annulé</h1>
        <p className="text-gray-600">Votre paiement a été annulé. Vous pouvez fermer cette page.</p>
      </div>
    </div>
  )
}
