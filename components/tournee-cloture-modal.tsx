"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Calendar, Euro, CreditCard, FileText, AlertTriangle } from "lucide-react";
import { cloturerTourneeAvecRetribution } from "@/app/actions/retribution";
import { TourneeSummary, SupportTransaction } from "@/lib/types/support-transactions";
import { Tournee } from "@/lib/types/tournee";
import toast from "react-hot-toast";

interface TourneeClotureModalProps {
  trigger: React.ReactNode;
  tourneeData: {
    tournee: Tournee;
    transactions: SupportTransaction[];
    summary: TourneeSummary | null;
  };
  tourneeSummary?: TourneeSummary;
}

export function TourneeClotureModal({ trigger, tourneeData, tourneeSummary }: TourneeClotureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmZeroOpen, setConfirmZeroOpen] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    montantEspeces: "",
    montantCheques: "",
    calendriersDistribues: "",
    notes: "",
  });

  // Répartition de la part pompier désormais gérée automatiquement côté serveur

  // Calculs
  const montantCartes = tourneeSummary?.cartes_total || 0;
  const montantEspeces = parseFloat(formData.montantEspeces) || 0;
  const montantCheques = parseFloat(formData.montantCheques) || 0;
  const totalFinal = montantEspeces + montantCheques + montantCartes;
  const montantAmicale = Math.max(0, Math.round(totalFinal * 70) / 100);
  const montantPompier = Math.max(0, Math.round(totalFinal * 30) / 100);

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const isCalendriersZero =
      formData.calendriersDistribues?.trim() === "" || Number(formData.calendriersDistribues) === 0;
    if (isCalendriersZero) {
      setConfirmZeroOpen(true);
      return;
    }
    await proceedSubmit();
  };

  const proceedSubmit = async () => {
    setIsLoading(true);
    try {
      const calendriersVendus = Number(formData.calendriersDistribues || "0") || 0;
      const res = await cloturerTourneeAvecRetribution({
        tourneeId: tourneeData.tournee.id,
        calendriersVendus,
        montantTotal: totalFinal,
      });
      if (!res?.ok) {
        toast.error(res?.error || "Erreur lors de la clôture de la tournée");
        return;
      }
      setIsOpen(false);
      toast.success(`Tournée clôturée. Répartition effectuée selon vos préférences.`, { duration: 4000 });
      router.push("/dashboard/mon-compte");
    } catch (error) {
      console.error("Erreur:", error);
      const message = (error as Error)?.message || "Erreur lors de la clôture de la tournée";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-orange-600" />
            <span>Déclaration de fin de tournée</span>
          </DialogTitle>
          <DialogDescription>Finalisez votre tournée en déclarant vos résultats</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Saisissez vos montants en espèces et en chèques. Les paiements en ligne (HelloAsso) s&apos;ajoutent automatiquement.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="montantEspeces" className="text-sm font-medium">
                Montant en espèces
              </Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="montantEspeces"
                  name="montantEspeces"
                  type="number"
                  value={formData.montantEspeces}
                  onChange={handleInputChange}
                  placeholder="Ex: 45.50"
                  className="pl-10 h-10"
                  step="0.50"
                  min="0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="montantCheques" className="text-sm font-medium">
                Montant en chèques
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="montantCheques"
                  name="montantCheques"
                  type="number"
                  value={formData.montantCheques}
                  onChange={handleInputChange}
                  placeholder="Ex: 25.00"
                  className="pl-10 h-10"
                  step="0.50"
                  min="0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="calendriersDistribues" className="text-sm font-medium">
                Calendriers distribués (optionnel)
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="calendriersDistribues"
                  name="calendriersDistribues"
                  type="number"
                  value={formData.calendriersDistribues}
                  onChange={handleInputChange}
                  placeholder="Ex: 15"
                  className="pl-10 h-10"
                  min="0"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cartes (auto)</Label>
              <div className="relative">
                <CreditCard className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input type="number" value={montantCartes.toFixed(2)} className="pl-7 bg-muted text-sm" disabled />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Total final</Label>
              <div className="p-2 rounded border border-emerald-200 bg-emerald-50">
                <span className="text-lg font-semibold text-emerald-700">{totalFinal.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {totalFinal > 0 && (
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded-md space-y-1">
                <div className="flex justify-between text-sm">
                  <span>→ Amicale (70%)</span>
                  <span className="font-medium">{montantAmicale.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>→ Pompier (30%)</span>
                  <span className="font-medium">{montantPompier.toFixed(2)}€</span>
                </div>
              </div>
              <div className="bg-accent/40 p-3 rounded-md text-xs text-muted-foreground">
                La part pompier (30%) sera répartie automatiquement entre votre compte et le pot d&apos;équipe
                selon vos préférences (voir Mon Compte) et le minimum imposé par l&apos;équipe.
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (optionnel)
            </Label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Observations..."
              className="w-full p-2 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none text-sm"
              rows={2}
              disabled={isLoading}
            />
          </div>
        </form>

        <DialogFooter className="pt-2 border-t border-border/50">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
            onClick={handleSubmit}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Clôture...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Clôturer la tournée
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      <Dialog open={confirmZeroOpen} onOpenChange={setConfirmZeroOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Clôturer sans calendriers ?</span>
            </DialogTitle>
            <DialogDescription>
              Aucun calendrier distribué n&apos;est renseigné. C&apos;est inhabituel. Confirmez si c&apos;est bien votre intention.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmZeroOpen(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={async () => {
                setConfirmZeroOpen(false);
                await proceedSubmit();
              }}
              disabled={isLoading}
            >
              Confirmer la clôture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

