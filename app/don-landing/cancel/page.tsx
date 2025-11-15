import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, Home, Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

function CancelContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Don annulé
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Votre transaction a été annulée
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Vous avez annulé le processus de don. Aucune transaction n&apos;a été effectuée et aucun montant n&apos;a été débité.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Si vous avez rencontré un problème ou si vous souhaitez nous contacter, n&apos;hésitez pas à nous joindre via le formulaire de contact.
          </p>
        </div>

        <div className="bg-brandCream dark:bg-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Heart className="w-6 h-6 text-brandRed dark:text-red-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                Vous souhaitez toujours nous soutenir ?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Vous pouvez réessayer à tout moment. Chaque contribution, même modeste, fait la différence !
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/#contact"
            className="block w-full bg-brandTurquoise hover:bg-brandTurquoise/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" />
            Faire un don
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Page d&apos;accueil
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Amicale des Sapeurs-Pompiers de Clermont-l&apos;Hérault
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Besoin d&apos;aide ? Contactez-nous à contact@amicale-sp-clermont.fr
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DonationCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Chargement...</div>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}
