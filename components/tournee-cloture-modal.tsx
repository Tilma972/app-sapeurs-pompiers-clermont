"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  FileText,
  CreditCard,
  Calculator,
  TrendingUp
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
    calendriersDistribues: '',
    montantEspeces: '',
    montantCheques: '',
    notes: ''
  });

  // Calculs en temps réel
  const montantCartes = tourneeSummary?.cartes_total || 0;
  const totalDeclare = 
    (parseFloat(formData.montantEspeces) || 0) + 
    (parseFloat(formData.montantCheques) || 0) + 
    montantCartes;
  
  const calendriersDistribues = parseFloat(formData.calendriersDistribues) || 0;
  const moyenneParCalendrier = calendriersDistribues > 0 ? totalDeclare / calendriersDistribues : 0;

  // Validation : au moins un montant (espèces OU chèques) doit être rempli
  // Les calendriers peuvent être vides (cas des dons fiscaux uniquement)
  const isFormValid = 
    (formData.montantEspeces.trim() !== '' || formData.montantCheques.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Préparation des données pour la Server Action
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('tournee_id', tourneeData.tournee.id);
      formDataToSubmit.append('calendriers_finaux', formData.calendriersDistribues);
      formDataToSubmit.append('montant_final', totalDeclare.toString());

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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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
          {/* Card principale unique pour tout le contenu */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Message d'aide compact */}
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                💡 Au moins un montant requis (espèces OU chèques). Calendriers optionnels.
              </div>

              {/* Section de Déclaration */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span>Votre déclaration</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="calendriersDistribues" className="text-sm font-medium">
                    Calendriers distribués (optionnel)
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="calendriersDistribues"
                      name="calendriersDistribues"
                      type="number"
                      value={formData.calendriersDistribues}
                      onChange={handleInputChange}
                      placeholder="Ex: 15 (ou 0 si dons fiscaux)"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montantEspeces" className="text-sm font-medium">
                    Montant en espèces
                  </Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="montantEspeces"
                      name="montantEspeces"
                      type="number"
                      value={formData.montantEspeces}
                      onChange={handleInputChange}
                      placeholder="Ex: 45.50"
                      className="pl-10"
                      step="0.50"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montantCheques" className="text-sm font-medium">
                    Montant en chèques
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="montantCheques"
                      name="montantCheques"
                      type="number"
                      value={formData.montantCheques}
                      onChange={handleInputChange}
                      placeholder="Ex: 25.00"
                      className="pl-10"
                      step="0.50"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section d'Information compacte */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Bilan</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Cartes (auto)</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                      <Input
                        type="number"
                        value={montantCartes.toFixed(2)}
                        className="pl-7 bg-gray-50 text-sm"
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Total déclaré</Label>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded border border-green-200">
                      <span className="text-lg font-bold text-green-600">{totalDeclare.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                {calendriersDistribues > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700">Moyenne par calendrier</span>
                      <span className="text-sm font-bold text-blue-600">{moyenneParCalendrier.toFixed(2)}€</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Notes compactes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (optionnel)
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Observations..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Boutons d'action dans le footer */}
        <DialogFooter>
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
