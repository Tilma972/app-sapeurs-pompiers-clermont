"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Euro, 
  CreditCard, 
  Banknote, 
  FileText, 
  User, 
  Mail, 
  StickyNote,
  Check,
  X,
  Trophy,
  Heart
} from "lucide-react";
import { 
  SupportTransactionInput, 
  calculateTransactionFields,
  validateSupportTransaction,
  getTransactionTypeDescription 
} from "@/lib/types/support-transactions";
import { submitSupportTransaction } from "@/app/actions/donation-actions";

interface DonationModalProps {
  trigger: React.ReactNode;
  tourneeId?: string;
}

const paymentMethods = [
  { id: 'especes', label: 'Espèces', icon: Banknote, color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'cheque', label: 'Chèque', icon: FileText, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'carte', label: 'Carte', icon: CreditCard, color: 'bg-purple-100 text-purple-700 border-purple-200' }
];

const quickAmounts = [5, 10, 15, 20];

export function DonationModal({ trigger, tourneeId }: DonationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // NOUVEL ÉTAT PRINCIPAL : calendar_accepted
  const [calendarAccepted, setCalendarAccepted] = useState(true); // Par défaut : soutien
  
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'especes',
    supporterName: '',
    supporterEmail: '',
    supporterPhone: '',
    notes: '',
    consentEmail: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!tourneeId) {
      setMessage({ 
        type: 'error', 
        text: 'Aucune tournée active trouvée' 
      });
      setIsLoading(false);
      return;
    }

    try {
      // Préparation des données pour la Server Action
      const transactionData: SupportTransactionInput = {
        amount: parseFloat(formData.amount),
        calendar_accepted: calendarAccepted,
        supporter_name: formData.supporterName || undefined,
        supporter_email: formData.supporterEmail || undefined,
        supporter_phone: formData.supporterPhone || undefined,
        payment_method: formData.paymentMethod as 'especes' | 'cheque' | 'carte',
        notes: formData.notes || undefined,
        tournee_id: tourneeId,
        consent_email: formData.consentEmail
      };

      // Validation côté client
      const validation = validateSupportTransaction(transactionData);
      if (!validation.valid) {
        setMessage({ 
          type: 'error', 
          text: validation.errors.join(', ') 
        });
        setIsLoading(false);
        return;
      }

      // Calcul des champs pour l'affichage
      const calculatedFields = calculateTransactionFields(transactionData);
      
      // Création du FormData pour la Server Action
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('amount', formData.amount);
      formDataToSubmit.append('calendar_accepted', calendarAccepted.toString());
      formDataToSubmit.append('supporter_name', formData.supporterName);
      formDataToSubmit.append('supporter_email', formData.supporterEmail);
      formDataToSubmit.append('supporter_phone', formData.supporterPhone);
      formDataToSubmit.append('payment_method', formData.paymentMethod);
      formDataToSubmit.append('notes', formData.notes);
      formDataToSubmit.append('tournee_id', tourneeId);
      formDataToSubmit.append('consent_email', formData.consentEmail.toString());

      // Appel de la Server Action
      const result = await submitSupportTransaction(formDataToSubmit);
      
      if (result.success) {
        const description = getTransactionTypeDescription(calculatedFields.transaction_type, transactionData.amount);
        setMessage({ 
          type: 'success', 
          text: `${description} - Enregistré avec succès !` 
        });
        
        // Reset du formulaire
        setFormData({
          amount: '',
          paymentMethod: 'especes',
          supporterName: '',
          supporterEmail: '',
          supporterPhone: '',
          notes: '',
          consentEmail: false
        });
        setCalendarAccepted(true);
        
        // Fermeture automatique après 3 secondes
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: result.errors?.join(', ') || 'Erreur lors de l\'enregistrement' 
        });
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erreur lors de l\'enregistrement du don' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuickAmount = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      amount: amount.toString()
    }));
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-green-600" />
            <span>Enregistrer un don</span>
          </DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle transaction de collecte
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message de statut */}
          {message && (
            <Card className={`${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {message.type === 'success' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Montant */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Montant du don</Label>
            
            {/* Boutons de montants rapides */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={formData.amount === amount.toString() ? "default" : "outline"}
                  onClick={() => handleQuickAmount(amount)}
                  className="h-12 text-lg font-medium"
                >
                  {amount}€
                </Button>
              ))}
            </div>
            
            {/* Saisie libre du montant */}
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Montant libre"
                className="pl-10 h-12 text-lg"
                min="0"
                step="0.50"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* CHECKBOX CALENDRIER - CHAMP CLÉ */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="calendar_accepted"
                checked={calendarAccepted}
                onCheckedChange={(checked) => setCalendarAccepted(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="calendar_accepted" className="text-base font-medium cursor-pointer">
                  📅 Je souhaite recevoir le calendrier en remerciement de mon soutien
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  {calendarAccepted 
                    ? "Soutien avec calendrier offert (pas de déduction fiscale)"
                    : "Don fiscal sans contrepartie (déduction d'impôt 66%)"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* CARDS DE FEEDBACK CONDITIONNELLES */}
          {formData.amount && (
            <div className="space-y-3">
              {!calendarAccepted ? (
                // Don fiscal
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Trophy className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          🏆 Don fiscal de {formData.amount}€
                        </p>
                        <p className="text-sm text-green-700">
                          Déduction d&apos;impôt : {Math.round(parseFloat(formData.amount || '0') * 0.66 * 100) / 100}€
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Sans contrepartie - Email obligatoire pour le reçu fiscal
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Soutien
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Heart className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">
                          🤝 Soutien de {formData.amount}€ avec calendrier offert
                        </p>
                        <p className="text-sm text-blue-700">
                          Pas de déduction fiscale
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Reçu de soutien disponible si email fourni
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}


          {/* Mode de paiement */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Mode de paiement</Label>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <Button
                    key={method.id}
                    type="button"
                    variant={formData.paymentMethod === method.id ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                    className={`h-12 flex items-center space-x-2 ${
                      formData.paymentMethod === method.id 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : ''
                    }`}
                    disabled={isLoading}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{method.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Informations du donateur */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Informations du donateur {!calendarAccepted && <span className="text-red-500">*</span>}
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supporterName" className="text-sm">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="supporterName"
                    name="supporterName"
                    type="text"
                    value={formData.supporterName}
                    onChange={handleInputChange}
                    placeholder="Nom du donateur"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supporterEmail" className="text-sm">
                  Email {!calendarAccepted && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="supporterEmail"
                    name="supporterEmail"
                    type="email"
                    value={formData.supporterEmail}
                    onChange={handleInputChange}
                    placeholder="email@exemple.com"
                    required={!calendarAccepted}
                    className={`pl-10 ${!calendarAccepted ? 'border-red-200 bg-red-50' : ''}`}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Message d'aide conditionnel */}
            {!calendarAccepted && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Email obligatoire :</strong> Pour un don fiscal, l&apos;email est requis pour générer le reçu fiscal permettant la déduction d&apos;impôt.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">Notes</Label>
              <div className="relative">
                <StickyNote className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Notes sur le don (optionnel)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Résumé */}
          {formData.amount && (
            <Card className={`${calendarAccepted ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {calendarAccepted ? 'Soutien avec calendrier' : 'Don fiscal'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formData.amount}€ • {calendarAccepted ? 'Pas de déduction' : 'Déduction 66%'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${calendarAccepted ? 'text-blue-600' : 'text-green-600'}`}>
                      {formData.amount}€
                    </div>
                    {!calendarAccepted && (
                      <div className="text-xs text-green-600">
                        -{Math.round(parseFloat(formData.amount) * 0.66 * 100) / 100}€ d&apos;impôt
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              disabled={isLoading || !formData.amount || parseFloat(formData.amount) <= 0}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer le don
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
