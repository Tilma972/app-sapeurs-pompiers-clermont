import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { DetailFondsUtilisateur } from '@/lib/types/depot-fonds'
import { CreditCard, Coins, PiggyBank, TrendingUp } from 'lucide-react'

interface DetailFondsCardProps {
  detail: DetailFondsUtilisateur
}

export function DetailFondsCard({ detail }: DetailFondsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Détail de vos fonds collectés
        </CardTitle>
        <CardDescription>
          Répartition entre espèces, paiements CB et dépôts effectués
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total collecté */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total collecté
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Toutes tournées terminées
              </p>
            </div>
          </div>
          <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(detail.total_collecte)}
          </div>
        </div>

        {/* Separator avec "dont" */}
        <div className="pl-8 space-y-3">
          {/* Paiements CB */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Paiements par carte
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Déjà sécurisés via Stripe
                </p>
              </div>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {formatCurrency(detail.total_cb_valide)}
            </div>
          </div>

          {/* Cash déjà déposé */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <PiggyBank className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Espèces déposées
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Remises au trésorier
                </p>
              </div>
            </div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(detail.total_cash_depose)}
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-2 border-orange-200 dark:border-orange-800">
            <div>
              <p className="text-base font-semibold text-orange-900 dark:text-orange-100">
                🏦 Espèces à déposer
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Montant restant à remettre physiquement
              </p>
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {formatCurrency(detail.cash_a_deposer)}
            </div>
          </div>
        </div>

        {/* Formule explicative */}
        {detail.total_collecte > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Calcul :</p>
            <p className="font-mono">
              {formatCurrency(detail.cash_a_deposer)} = ({formatCurrency(detail.total_collecte)} collecté - {formatCurrency(detail.total_cb_valide)} CB) - {formatCurrency(detail.total_cash_depose)} déposé
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
