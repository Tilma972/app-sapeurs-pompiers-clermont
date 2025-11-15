import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Mail, FileText, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

function SuccessContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Merci pour votre générosité !
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Votre don a été traité avec succès
          </p>
        </div>

        <div className="bg-brandCream dark:bg-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Mail className="w-6 h-6 text-brandTurquoise dark:text-blue-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                Confirmation par email
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Un email de confirmation vous a été envoyé avec tous les détails de votre transaction.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-brandOrange dark:text-orange-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                Reçu fiscal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Si votre don est éligible (montant ≥ 6€), un reçu fiscal vous sera envoyé par email dans les prochaines minutes.
                Ce reçu vous permet de bénéficier d&apos;une déduction fiscale de 66% du montant de votre don.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Important :</strong> Conservez votre reçu fiscal pour votre déclaration d&apos;impôts.
            Il sera également accessible à tout moment depuis votre email.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/#contact"
            className="block w-full bg-brandTurquoise hover:bg-brandTurquoise/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
          >
            Retour au site
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
            Votre soutien nous aide à poursuivre nos actions au service de la communauté
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Chargement...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
