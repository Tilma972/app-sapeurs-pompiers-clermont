'use client'

/**
 * Liste des demandes de dépense du pot d'équipe
 * Vue partagée chef + membres
 * Affiche statuts colorés, justificatifs, alertes facture manquante
 */

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { DemandePotEquipeAvecRelations, StatutDemandePot } from '@/lib/supabase/pot-depenses'

const INFO_BADGE_TEXT = `Le paiement est toujours effectué par le trésorier au nom de l'amicale. Tous les membres de l'équipe voient les demandes. Si la facture finale est supérieure au devis approuvé, une demande complémentaire est nécessaire pour l'écart.`

function statutVariant(statut: StatutDemandePot): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (statut) {
    case 'soumise': return 'secondary'
    case 'approuvée': return 'default'
    case 'payée': return 'outline'
    case 'rejetée': return 'destructive'
    default: return 'secondary'
  }
}

function statutLabel(statut: StatutDemandePot): string {
  switch (statut) {
    case 'soumise': return '📋 Soumise'
    case 'approuvée': return '✅ Approuvée'
    case 'payée': return '💳 Payée'
    case 'rejetée': return '❌ Rejetée'
    default: return statut
  }
}

interface DemandePotItemProps {
  demande: DemandePotEquipeAvecRelations
}

function DemandePotItem({ demande }: DemandePotItemProps) {
  const [expanded, setExpanded] = useState(false)

  const factureManquante =
    demande.statut === 'payée' &&
    demande.justificatif_est_provisoire &&
    !demande.facture_finale_url

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{demande.prestataire_nom}</span>
            <Badge variant={statutVariant(demande.statut)} className="shrink-0 text-xs">
              {statutLabel(demande.statut)}
            </Badge>
            {factureManquante && (
              <Badge variant="outline" className="shrink-0 text-xs border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/30">
                ⚠️ Facture définitive manquante
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{demande.motif}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-semibold tabular-nums">{formatCurrency(demande.montant_demande)}</div>
          {demande.montant_paye !== null && demande.montant_paye !== demande.montant_demande && (
            <div className="text-xs text-muted-foreground tabular-nums">
              payé : {formatCurrency(demande.montant_paye)}
            </div>
          )}
        </div>
      </div>

      {/* Détails dépliables */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Moins de détails' : 'Plus de détails'}
        <span className="ml-1 text-muted-foreground/60">
          · {formatDate(demande.created_at)}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2 pt-1 border-t text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Soumis par</span>
            <span>{(demande.chef as { full_name?: string | null; display_name?: string | null } | null)?.full_name ?? (demande.chef as { full_name?: string | null; display_name?: string | null } | null)?.display_name ?? '—'}</span>

            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(demande.created_at)}</span>

            {demande.traite_par_profile && (
              <>
                <span className="text-muted-foreground">Traité par</span>
                <span>{(demande.traite_par_profile as { full_name?: string | null } | null)?.full_name ?? '—'}</span>
              </>
            )}

            {demande.notes_tresorier && (
              <>
                <span className="text-muted-foreground">Note trésorier</span>
                <span className="italic">{demande.notes_tresorier}</span>
              </>
            )}

            {demande.motif_rejet && (
              <>
                <span className="text-muted-foreground">Motif rejet</span>
                <span className="text-destructive">{demande.motif_rejet}</span>
              </>
            )}

            {demande.paid_at && (
              <>
                <span className="text-muted-foreground">Payé le</span>
                <span>{formatDate(demande.paid_at)}</span>
              </>
            )}
          </div>

          {/* Justificatifs */}
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={demande.justificatif_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {demande.justificatif_est_provisoire ? 'Devis provisoire' : 'Justificatif'}
            </a>
            {demande.facture_finale_url && (
              <a
                href={demande.facture_finale_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Facture définitive
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface DemandesPotListeProps {
  demandes: DemandePotEquipeAvecRelations[]
  equipeNom?: string
}

export function DemandesPotListe({ demandes, equipeNom }: DemandesPotListeProps) {
  if (demandes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Dépenses du pot d&apos;équipe</CardTitle>
              {equipeNom && <CardDescription>{equipeNom}</CardDescription>}
            </div>
            <InfoPopover />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune demande de dépense pour le moment
          </p>
        </CardContent>
      </Card>
    )
  }

  const nbFacturesManquantes = demandes.filter(
    (d) => d.statut === 'payée' && d.justificatif_est_provisoire && !d.facture_finale_url
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Dépenses du pot d&apos;équipe</CardTitle>
            {equipeNom && (
              <CardDescription>{equipeNom} · {demandes.length} demande{demandes.length > 1 ? 's' : ''}</CardDescription>
            )}
          </div>
          <InfoPopover />
        </div>
        {nbFacturesManquantes > 0 && (
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-3 mt-2">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ {nbFacturesManquantes} dépense{nbFacturesManquantes > 1 ? 's ont' : ' a'} un justificatif provisoire — facture définitive manquante.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {demandes.map((demande) => (
            <DemandePotItem key={demande.id} demande={demande} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function InfoPopover() {
  const [open, setOpen] = useState(false)
  return (
    <div className="shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Info className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only text-xs">Fonctionnement</span>
      </Button>
      {open && (
        <div className="mt-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground max-w-xs">
          {INFO_BADGE_TEXT}
        </div>
      )}
    </div>
  )
}
