import { DemandeVersement, getStatutLabel, getTypeVersementLabel, getStatutBadgeVariant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateLong } from "@/lib/formatters";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DemandesListeProps {
  demandes: DemandeVersement[];
}

export function DemandesListe({ demandes }: DemandesListeProps) {
  if (demandes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>Aucune demande de versement</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {demandes.map((demande) => (
        <Card key={demande.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              {/* Informations principales */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatutBadgeVariant(demande.statut)}>
                    {getStatutLabel(demande.statut)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getTypeVersementLabel(demande.type_versement)}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {formatCurrency(demande.montant)}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Demandé le {formatDateLong(demande.created_at)}
                </div>

                {/* Détails selon le statut */}
                {demande.statut === 'en_attente' && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>En attente de validation</span>
                  </div>
                )}

                {demande.statut === 'en_cours' && demande.validated_at && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Validé le {formatDateLong(demande.validated_at)} • Paiement en cours</span>
                  </div>
                )}

                {demande.statut === 'payee' && demande.paid_at && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Payé le {formatDateLong(demande.paid_at)}</span>
                  </div>
                )}

                {demande.statut === 'rejetee' && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <XCircle className="h-3 w-3" />
                      <span>Refusé {demande.rejected_at && `le ${formatDateLong(demande.rejected_at)}`}</span>
                    </div>
                    {demande.rejection_reason && (
                      <div className="p-2 rounded bg-destructive/10 text-xs text-destructive">
                        <strong>Raison:</strong> {demande.rejection_reason}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes trésorier */}
                {demande.notes_tresorier && (
                  <div className="p-2 rounded bg-muted/50 text-xs">
                    <strong>Note du trésorier:</strong> {demande.notes_tresorier}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
