"use client";

import { useState, useTransition } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { validerDemandeAction, rejeterDemandeAction } from "@/app/actions/versement";
import { toast } from "react-hot-toast";
import type { DemandeVersement } from "@/lib/supabase/tresorerie";

interface DemandesEnAttenteListeProps {
    demandes: DemandeVersement[];
}

export function DemandesEnAttenteListe({ demandes }: DemandesEnAttenteListeProps) {
    const [isPending, startTransition] = useTransition();
    const [rejectReason, setRejectReason] = useState("");
    const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    const handleValidate = (demandeId: string) => {
        if (confirm("Valider cette demande ?")) {
            startTransition(async () => {
                const result = await validerDemandeAction({ demande_id: demandeId });
                if (result.success) {
                    toast.success("Demande validée");
                } else {
                    toast.error(result.error || "Erreur lors de la validation");
                }
            });
        }
    };

    const handleReject = async () => {
        if (!selectedDemandeId) return;

        if (rejectReason.trim().length < 10) {
            toast.error("La raison du rejet doit contenir au moins 10 caractères");
            return;
        }

        startTransition(async () => {
            const result = await rejeterDemandeAction({
                demande_id: selectedDemandeId,
                raison: rejectReason,
            });

            if (result.success) {
                toast.success("Demande rejetée");
                setIsRejectDialogOpen(false);
                setRejectReason("");
                setSelectedDemandeId(null);
            } else {
                toast.error(result.error || "Erreur lors du rejet");
            }
        });
    };

    if (demandes.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
                Aucune demande en attente
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Pompier</TableHead>
                        <TableHead>Équipe</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {demandes.map((demande) => (
                        <TableRow key={demande.id}>
                            <TableCell className="font-medium">{demande.user_name}</TableCell>
                            <TableCell>{demande.equipe_nom || "-"}</TableCell>
                            <TableCell>{formatCurrency(demande.montant)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize">
                                    {demande.type_versement.replace("_", " ")}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(demande.created_at)}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                    onClick={() => handleValidate(demande.id)}
                                    disabled={isPending}
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>

                                <Dialog open={isRejectDialogOpen && selectedDemandeId === demande.id} onOpenChange={(open) => {
                                    setIsRejectDialogOpen(open);
                                    if (open) setSelectedDemandeId(demande.id);
                                    else {
                                        setSelectedDemandeId(null);
                                        setRejectReason("");
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            disabled={isPending}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Rejeter la demande</DialogTitle>
                                            <DialogDescription>
                                                Veuillez indiquer la raison du rejet pour {demande.user_name}.
                                                Cette action est irréversible et le montant sera recrédité sur le compte du pompier.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Textarea
                                                placeholder="Raison du rejet (min. 10 caractères)..."
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Annuler</Button>
                                            <Button
                                                variant="destructive"
                                                onClick={handleReject}
                                                disabled={isPending || rejectReason.trim().length < 10}
                                            >
                                                {isPending ? "Rejet en cours..." : "Confirmer le rejet"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
