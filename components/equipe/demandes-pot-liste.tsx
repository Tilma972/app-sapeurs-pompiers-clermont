'use client'

/**
 * Liste des demandes de pot d'équipe
 * Visible par tous les membres de l'équipe (transparence)
 */

import { DemandePotEquipeAvecDetails } from '@/lib/types/pot-equipe'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateLong } from '@/lib/formatters'
import {
  getStatutPotLabel,
  getStatutPotBadgeVariant,
  getCategorieLabel,
  getCategorieEmoji,
  formatTitreDemande,
} from '@/lib/types/pot-equipe'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface DemandesPotListeProps {
  demandes: DemandePotEquipeAvecDetails[]
}

export function DemandesPotListe({ demandes }: DemandesPotListeProps) {
  if (demandes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Aucune demande de pot d&apos;équipe
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {demandes.map((demande) => (
        <Card key={demande.id} className="hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{getCategorieEmoji(demande.categorie)}</span>
                  <h3 className="font-semibold text-base">
                    {formatTitreDemande(demande.titre, 60)}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{getCategorieLabel(demande.categorie)}</span>
                  <span>•</span>
                  <span>Par {demande.demandeur?.full_name || demande.demandeur?.display_name || 'Anonyme'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={getStatutPotBadgeVariant(demande.statut)}>
                  {getStatutPotLabel(demande.statut)}
                </Badge>
                <span className="text-lg font-bold">
                  {formatCurrency(demande.montant)}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-3">
            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {demande.description.length > 150
                ? `${demande.description.substring(0, 150)}...`
                : demande.description}
            </p>

            {/* Informations supplémentaires selon le statut */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Demandé le {formatDateLong(demande.created_at)}</div>

              {demande.statut === 'validee' && demande.validated_at && (
                <div className="text-green-600 dark:text-green-400">
                  Validée le {formatDateLong(demande.validated_at)}
                </div>
              )}

              {demande.statut === 'payee' && demande.paid_at && (
                <div className="text-green-600 dark:text-green-400">
                  Payée le {formatDateLong(demande.paid_at)}
                </div>
              )}

              {demande.statut === 'rejetee' && demande.rejection_reason && (
                <div className="text-destructive mt-2 p-2 rounded bg-destructive/10">
                  <strong>Rejetée:</strong> {demande.rejection_reason}
                </div>
              )}
            </div>

            {/* Notes du demandeur (si présentes) */}
            {demande.notes_demandeur && (
              <div className="text-xs p-2 rounded bg-muted/50">
                <strong>Note:</strong> {demande.notes_demandeur}
              </div>
            )}

            {/* Notes du trésorier (si présentes) */}
            {demande.notes_tresorier && (
              <div className="text-xs p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <strong>Trésorier:</strong> {demande.notes_tresorier}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
