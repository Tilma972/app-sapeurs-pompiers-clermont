import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DonationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-darkSurface rounded-lg shadow-xl p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-darkText mb-4">
          Merci pour votre générosité !
        </h1>

        <p className="text-lg text-gray-700 dark:text-darkText/80 mb-4">
          Votre don a été enregistré avec succès.
        </p>

        <p className="text-sm text-gray-600 dark:text-darkText/70 mb-6">
          Un reçu fiscal vous sera envoyé par email dans les prochaines minutes.
          Si vous ne le recevez pas, pensez à vérifier vos courriers indésirables.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
            💡 Votre don est déductible à hauteur de 66% de son montant dans la limite de 20% de votre revenu imposable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/#contact"
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-darkBg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-darkText font-semibold rounded-lg transition-colors"
          >
            Nous contacter
          </Link>
        </div>

        <p className="text-xs text-gray-500 dark:text-darkText/60 mt-6">
          Votre soutien nous aide à maintenir nos activités et à soutenir nos membres. Merci !
        </p>
      </div>
    </div>
  );
}
