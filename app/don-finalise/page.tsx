export default function DonFinalisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-md mx-auto pt-16">
        <div className="bg-white rounded-lg shadow-xl p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-700 mb-2">Merci, c&apos;est fait !</h1>
          <p className="text-gray-600">Votre reçu vous a été envoyé par email.</p>
          <p className="text-gray-500 text-sm mt-2">Si vous ne le voyez pas, vérifiez vos courriers indésirables.</p>
          <div className="mt-6">
            <a href={process.env.NEXT_PUBLIC_SITE_URL || '/'} className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700">Retour à l’accueil</a>
          </div>
        </div>
      </div>
    </div>
  )
}
