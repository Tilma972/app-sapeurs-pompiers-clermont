'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Save } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { upsertSoldeAnterieurAction } from '@/app/actions/pot-historique'
import type { EquipePotSummary } from '@/lib/types'

interface RowState {
  solde: string
  notes: string
  isDirty: boolean
  isSaving: boolean
}

interface SoldesAnterieursProps {
  summaries: EquipePotSummary[]
  annee: number
}

export function SoldesAnterieursSection({ summaries, annee }: SoldesAnterieursProps) {
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(
    Object.fromEntries(
      summaries.map((s) => [
        s.equipe_id,
        {
          solde: s.solde_anterieur.toFixed(2),
          notes: s.notes ?? '',
          isDirty: false,
          isSaving: false,
        },
      ])
    )
  )
  const [, startTransition] = useTransition()

  const updateRow = (equipeId: string, patch: Partial<RowState>) => {
    setRowStates((prev) => ({
      ...prev,
      [equipeId]: { ...prev[equipeId], ...patch },
    }))
  }

  const handleSave = (equipeId: string, equipeNom: string) => {
    const row = rowStates[equipeId]
    if (!row) return

    const soldeNum = parseFloat(row.solde)
    if (isNaN(soldeNum) || soldeNum < 0) {
      toast.error('Montant invalide — doit être un nombre positif')
      return
    }

    updateRow(equipeId, { isSaving: true })

    startTransition(async () => {
      const result = await upsertSoldeAnterieurAction({
        equipeId,
        annee,
        solde: soldeNum,
        notes: row.notes.trim() || undefined,
      })

      if (result.success) {
        toast.success(`Solde antérieur de ${equipeNom} sauvegardé`)
        updateRow(equipeId, { isDirty: false, isSaving: false })
      } else {
        toast.error(result.error ?? 'Erreur lors de la sauvegarde')
        updateRow(equipeId, { isSaving: false })
      }
    })
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Soldes antérieurs — Campagne {annee}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune équipe avec rétribution activée
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soldes antérieurs — Campagne {annee}</CardTitle>
        <CardDescription>
          Saisissez ici les fonds reportés depuis les années précédentes pour chaque équipe.
          Ces montants s&apos;ajoutent au pot calculé depuis les tournées pour former le
          Total disponible affiché dans Mon Compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Équipe</TableHead>
                <TableHead className="text-right">Pot campagne {annee}</TableHead>
                <TableHead className="w-[160px]">Solde antérieur (€)</TableHead>
                <TableHead className="text-right">Total disponible</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => {
                const row = rowStates[summary.equipe_id]
                if (!row) return null
                const soldeNum = parseFloat(row.solde) || 0
                const totalCalcule = summary.part_equipe_campagne + soldeNum

                return (
                  <TableRow key={summary.equipe_id}>
                    <TableCell className="font-medium">{summary.equipe_nom}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatCurrency(summary.part_equipe_campagne)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.solde}
                        onChange={(e) =>
                          updateRow(summary.equipe_id, {
                            solde: e.target.value,
                            isDirty: true,
                          })
                        }
                        aria-label={`Solde antérieur ${summary.equipe_nom}`}
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(totalCalcule)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Optionnel…"
                        value={row.notes}
                        onChange={(e) =>
                          updateRow(summary.equipe_id, {
                            notes: e.target.value,
                            isDirty: true,
                          })
                        }
                        aria-label={`Notes ${summary.equipe_nom}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={row.isDirty ? 'default' : 'outline'}
                        onClick={() => handleSave(summary.equipe_id, summary.equipe_nom)}
                        disabled={!row.isDirty || row.isSaving}
                        aria-label={`Sauvegarder ${summary.equipe_nom}`}
                      >
                        {row.isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          La sauvegarde est indépendante par équipe. Le bouton s&apos;active dès qu&apos;une
          modification est détectée.
        </p>
      </CardContent>
    </Card>
  )
}
