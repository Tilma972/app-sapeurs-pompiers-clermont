"use client";

import { useState } from "react";
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
  DialogFooter
} from "@/components/ui/dialog";
import { 
  CheckCircle,
  Calendar,
  Euro,
  CreditCard,
  FileText
} from "lucide-react";
import { cloturerTournee } from "@/app/actions/donation-actions";
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
  
  const [formData, setFormData] = useState({
    montantEspeces: '',
    montantCheques: '',
    calendriersDistribues: '',
    notes: ''
  });

  // Calculs simples
  const montantCartes = tourneeSummary?.cartes_total || 0;
  const montantEspeces = parseFloat(formData.montantEspeces) || 0;
  const montantCheques = parseFloat(formData.montantCheques) || 0;
  const totalFinal = montantEspeces + montantCheques + montantCartes;
  // Optionally compute moyenne by calendar if needed later
  // const calendriersDistribues = parseFloat(formData.calendriersDistribues) || 0;
  // const moyenneParCalendrier = calendriersDistribues > 0 ? totalFinal / calendriersDistribues : 0;

  // Validation : au moins un des deux (espèces ou chèques) > 0
  const hasEspeces = formData.montantEspeces.trim() !== '' && montantEspeces > 0;
  const hasCheques = formData.montantCheques.trim() !== '' && montantCheques > 0;
  const isFormValid = hasEspeces || hasCheques;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Préparation des données pour la Server Action
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('tournee_id', tourneeData.tournee.id);
  formDataToSubmit.append('calendriers_finaux', formData.calendriersDistribues);
  formDataToSubmit.append('montant_final', totalFinal.toString());

      // Appel de la Server Action
      const result = await cloturerTournee(formDataToSubmit);
      
      if (result.success) {
        // Fermer le modal
        setIsOpen(false);
        
        // Afficher le toast de succès avec gamification
        toast.success("Tournée clôturée avec succès. Excellent travail ! 💪", {
          duration: 4000,
          style: {
            background: '#10b981',
            color: 'white',
            fontWeight: 'bold',
          },
        });
      } else {
        toast.error(result.errors?.join(', ') || 'Erreur lors de la clôture de la tournée');
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la clôture de la tournée');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
  <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-orange-600" />
            <span>Déclaration de fin de tournée</span>
          </DialogTitle>
          <DialogDescription>
            Finalisez votre tournée en déclarant vos résultats
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Message d'aide minimal */}
          <div className="text-xs text-muted-foreground">
            Saisissez vos montants en espèces et en chèques. Les paiements en ligne (HelloAsso) s&apos;ajoutent automatiquement.
          </div>

          {/* Principale: Montants espèces + chèques, puis calendriers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="montantEspeces" className="text-sm font-medium">Montant en espèces</Label>
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
              <Label htmlFor="montantCheques" className="text-sm font-medium">Montant en chèques</Label>
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
              <Label htmlFor="calendriersDistribues" className="text-sm font-medium">Calendriers distribués (optionnel)</Label>
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

          {/* Récapitulatif compact */}
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

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (optionnel)</Label>
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

        {/* Boutons d'action dans le footer */}
        <DialogFooter className="pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
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
    </Dialog>
  );
}
