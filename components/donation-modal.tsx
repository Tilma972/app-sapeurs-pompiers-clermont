"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/dialog";
import { Euro, CreditCard, Banknote, FileText, User, Mail, StickyNote, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  SupportTransactionInput,
  calculateTransactionFields,
  validateSupportTransaction,
  getTransactionTypeDescription,
} from "@/lib/types/support-transactions";
import { submitSupportTransaction } from "@/app/actions/donation-actions";
import { QRCodeModal } from '@/components/qr-code-modal'
import { StripePaymentModal } from '@/components/stripe-payment-modal'
// Unified card payment action
import { createCardPaymentIntent } from '@/app/actions/card-payments'
// import { createDonationIntent } from '@/app/actions/donation-intent'
import { FISCAL_CONFIG, isFiscalEligible, calculateTaxDeduction } from '@/lib/config/fiscal'
import { FinalizationOptionsModal } from '@/components/finalization-options-modal'

interface DonationModalProps {
  trigger: React.ReactNode;
  tourneeId?: string;
}

const paymentMethods = [
  { id: "especes", label: "Espèces", icon: Banknote },
  { id: "cheque", label: "Chèque", icon: FileText },
  { id: "carte", label: "Carte", icon: CreditCard },
] as const;

const quickAmounts = [5, 10, 15, 20];

export function DonationModal({ trigger, tourneeId }: DonationModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeData, setQRCodeData] = useState<{ intentId: string; url: string; expiresAt: string } | null>(null)
  // const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [showStripeModal, setShowStripeModal] = useState(false)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [stripeIntentId, setStripeIntentId] = useState<string | null>(null)
  const [showFinalizationModal, setShowFinalizationModal] = useState(false)
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null)

  const isServerActionNotFound = (err: unknown) => {
    let msg = ''
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      msg = (err as { message: string }).message
    } else if (typeof err === 'string') {
      msg = err
    } else {
      msg = String(err ?? '')
    }
    return msg.includes('Failed to find Server Action')
  }

  // État principal : soutien (avec calendrier) vs fiscal
  const [calendarAccepted, setCalendarAccepted] = useState(true);

  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "especes",
    supporterName: "",
    supporterEmail: "",
    supporterPhone: "",
    notes: "",
    consentEmail: false,
  });

  const amountNumber = useMemo(() => parseFloat(formData.amount || "0") || 0, [formData.amount]);
  const calendarGiven = calendarAccepted // calendrier remis = soutien
  const fiscalEligible = useMemo(() => isFiscalEligible(amountNumber, calendarGiven), [amountNumber, calendarGiven])
  const deduction = useMemo(() => calculateTaxDeduction(amountNumber, fiscalEligible), [amountNumber, fiscalEligible])

  // QR HelloAsso direct n'est plus nécessaire ici: géré via l'action unifiée (fallback)

  // Décide automatiquement du bon flux carte:
  // - Soutien (pas fiscal) => Stripe
  // - Don fiscal => HelloAsso
  const handleCardPayment = async () => {
    setIsLoading(true)
    setMessage(null)
    if (!tourneeId) {
      setMessage({ type: 'error', text: 'Aucune tournée active trouvée' })
      setIsLoading(false)
      return
    }
    const parsed = parseFloat(formData.amount || '0')
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage({ type: 'error', text: 'Veuillez saisir un montant valide' })
      setIsLoading(false)
      return
    }

    // Choix implicite en fonction du reçu fiscal
    try {
      const res = await createCardPaymentIntent({ tourneeId: tourneeId!, amount: parsed, calendarGiven: calendarAccepted })
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'Erreur création paiement' })
      } else if (res.provider === 'stripe' && res.clientSecret) {
        setStripeClientSecret(res.clientSecret)
        setStripeIntentId(res.intentId!)
        setShowStripeModal(true)
      } else if (res.provider === 'helloasso' && res.donationUrl && res.intentId && res.expiresAt) {
        setQRCodeData({ intentId: res.intentId, url: res.donationUrl, expiresAt: res.expiresAt })
        setShowQRModal(true)
      } else {
        setMessage({ type: 'error', text: 'Flux de paiement inconnu' })
      }
    } catch (err) {
      console.error('Erreur création paiement carte:', err)
      if (isServerActionNotFound(err)) {
        setMessage({ type: 'error', text: 'Une mise à jour de l’application vient d’être déployée. Rafraîchissement en cours…' })
        // Forcer un rechargement pour resynchroniser les Server Actions
        setTimeout(() => {
          try {
            window.location.reload()
          } catch {}
        }, 800)
      } else {
        setMessage({ type: 'error', text: 'Erreur création paiement carte' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!tourneeId) {
      setMessage({ type: "error", text: "Aucune tournée active trouvée" });
      setIsLoading(false);
      return;
    }

    // ========================================
    // FLUX CARTE unique (décision implicite)
    // ========================================
    if (formData.paymentMethod === 'carte') {
      await handleCardPayment()
      return
    }

    // ========================================
    // FLUX STANDARD - Espèces / Chèque
    // ========================================
    try {
      const transactionData: SupportTransactionInput = {
        amount: amountNumber,
        calendar_accepted: calendarAccepted,
        supporter_name: formData.supporterName || undefined,
        supporter_email: formData.supporterEmail || undefined,
        supporter_phone: formData.supporterPhone || undefined,
        payment_method: formData.paymentMethod as "especes" | "cheque" | "carte",
        notes: formData.notes || undefined,
        tournee_id: tourneeId,
        consent_email: formData.consentEmail,
      };

      const validation = validateSupportTransaction(transactionData);
      if (!validation.valid) {
        setMessage({ type: "error", text: validation.errors.join(", ") });
        setIsLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append("amount", String(transactionData.amount));
      fd.append("calendar_accepted", String(transactionData.calendar_accepted));
      if (formData.supporterName) fd.append("supporter_name", formData.supporterName);
      if (formData.supporterEmail) fd.append("supporter_email", formData.supporterEmail);
      if (formData.supporterPhone) fd.append("supporter_phone", formData.supporterPhone);
      fd.append("payment_method", formData.paymentMethod);
      if (formData.notes) fd.append("notes", formData.notes);
      // Paiements espèces/chèque ET don fiscal (sans calendrier) éligible => finalisation différée par le donateur
      if (!calendarAccepted && fiscalEligible) {
        fd.append('payment_status', 'pending_donor_info');
      }
      fd.append("tournee_id", tourneeId);
      fd.append("consent_email", String(formData.consentEmail));

      let result: Awaited<ReturnType<typeof submitSupportTransaction>>
      try {
        result = await submitSupportTransaction(fd)
      } catch (err) {
        console.error('Erreur action enregistrement:', err)
        if (isServerActionNotFound(err)) {
          setMessage({ type: 'error', text: 'Une mise à jour de l’application vient d’être déployée. Rafraîchissement en cours…' })
          setIsLoading(false)
          setTimeout(() => {
            try { window.location.reload() } catch {}
          }, 800)
          return
        }
        throw err
      }
      // Si finalisation différée, ouvrir le modal d'options (QR / email)
      if (!calendarAccepted && fiscalEligible && result.transaction?.id) {
        setPendingTransactionId(result.transaction.id);
        setShowFinalizationModal(true);
        setIsLoading(false);
        return;
      }
      
      if (result.success) {
        const calculated = calculateTransactionFields(transactionData);
        const description = getTransactionTypeDescription(calculated.transaction_type, transactionData.amount);
        setMessage({ type: "success", text: `${description} - Enregistré avec succès !${formData.supporterEmail ? ` · reçu envoyé à ${formData.supporterEmail}` : ''}` });

        // Reset formulaire
        setFormData({
          amount: "",
          paymentMethod: "especes",
          supporterName: "",
          supporterEmail: "",
          supporterPhone: "",
          notes: "",
          consentEmail: false,
        });
        setCalendarAccepted(true);

        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: "error", text: result.errors?.join(", ") || "Erreur lors de l'enregistrement" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setMessage({ type: "error", text: "Erreur lors de l'enregistrement du don" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuickAmount = (amount: number) => {
    setFormData((prev) => ({ ...prev, amount: amount.toString() }));
  };

  // Unified notification listener: refresh data when a donation completes
  useEffect(() => {
    const handler = () => {
      try {
        router.refresh()
      } catch {
        // no-op
      }
    }
    window.addEventListener('donation-completed', handler as EventListener)
    return () => window.removeEventListener('donation-completed', handler as EventListener)
  }, [router])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
  <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-emerald-600" />
            <span>Enregistrer un don</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Montant + type, puis paiement. Les détails sont optionnels.
          </DialogDescription>
        </DialogHeader>

  <form onSubmit={handleSubmit} className="space-y-3">
          {message && (
            <Alert variant={message.type === "success" ? "success" : "destructive"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Étape 1: Montant + Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Montant et type</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={formData.amount === String(amount) ? "default" : "outline"}
                  onClick={() => handleQuickAmount(amount)}
                  className="h-10 text-sm font-medium"
                >
                  {amount}€
                </Button>
              ))}
            </div>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Montant libre"
                className="pl-10 h-10"
                min="0"
                step="0.50"
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={calendarAccepted ? "default" : "outline"}
                onClick={() => setCalendarAccepted(true)}
                className={`${calendarAccepted ? "bg-emerald-600 hover:bg-emerald-700" : ""} h-9 text-xs`}
              >
                🟢 Soutien (avec calendrier)
              </Button>
              <Button
                type="button"
                variant={!calendarAccepted ? "default" : "outline"}
                onClick={() => setCalendarAccepted(false)}
                className={`${!calendarAccepted ? "bg-sky-600 hover:bg-sky-700" : ""} h-9 text-xs`}
              >
                🔵 Don fiscal (66%)
              </Button>
            </div>
            {formData.amount && (
              <div className="text-xs text-muted-foreground">
                <span>{formData.amount}€ • Calendrier {calendarAccepted ? 'remis' : 'non remis'}</span>
                <span className="mx-1">•</span>
                {fiscalEligible ? (
                  <span>Éligible reçu fiscal (déduction {deduction}€)</span>
                ) : (
                  <span>Non éligible reçu fiscal{calendarAccepted ? ` (don < ${FISCAL_CONFIG.MIN_DONATION_FOR_FISCAL}€ avec calendrier)` : ''}</span>
                )}
              </div>
            )}
          </div>

          {/* Étape 2: Paiement */}
          {/* Indicateur d'éligibilité fiscale */}
          {formData.amount && (
            <div className={`text-xs rounded-md px-3 py-2 ${fiscalEligible ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              {fiscalEligible ? (
                <span>Éligible au reçu fiscal · Déduction estimée {deduction}€ (66%)</span>
              ) : (
                <span>Non éligible: valeur du calendrier (≈{FISCAL_CONFIG.CALENDAR_VALUE}€) dépasse 25% du don</span>
              )}
            </div>
          )}

          {/* Étape 2: Paiement */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Mode de paiement</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const selected = formData.paymentMethod === method.id;
                return (
                  <Button
                    key={method.id}
                    type="button"
                    variant="outline"
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: method.id }))}
                    className={`h-10 flex items-center gap-2 transition-colors ${
                      selected
                        ? method.id === "especes"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
                          : method.id === "cheque"
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700"
                          : "bg-purple-600 hover:bg-purple-700 text-white border-purple-700"
                        : ""
                    }`}
                    disabled={isLoading}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{method.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Étape 3: Détails conditionnels (cachés si carte) */}
          {formData.paymentMethod !== 'carte' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Détails {!calendarAccepted && !fiscalEligible && (
                <span className="text-red-500">(email requis pour don fiscal)</span>
              )}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="supporterName" className="text-sm">
                  Nom
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="supporterName"
                    name="supporterName"
                    type="text"
                    value={formData.supporterName}
                    onChange={handleInputChange}
                    placeholder="Nom du donateur"
                    className="pl-10 h-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supporterEmail" className="text-sm">
                  {(() => {
                    const requireEmailNow = !calendarAccepted && !fiscalEligible
                    return (
                      <>
                        Email {requireEmailNow && <span className="text-red-500">*</span>}
                      </>
                    )
                  })()}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="supporterEmail"
                    name="supporterEmail"
                    type="email"
                    value={formData.supporterEmail}
                    onChange={handleInputChange}
                    placeholder="email@exemple.com"
                    required={!calendarAccepted && !fiscalEligible}
                    className={`pl-10 h-10 ${(!calendarAccepted && !fiscalEligible) ? "border-red-200 bg-red-50" : ""}`}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            {!calendarAccepted && !fiscalEligible && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800">
                  Email requis pour délivrer le reçu fiscal (déduction 66%).
                </p>
              </div>
            )}
            {!calendarAccepted && fiscalEligible && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-green-800">
                  Pas besoin de saisir l&rsquo;email ici : le donateur le renseignera en scannant le QR et recevra ensuite son reçu fiscal.
                </p>
              </div>
            )}
            {calendarAccepted && (
              <p className="text-xs text-muted-foreground">
                L&rsquo;email est facultatif pour un don de soutien. Si renseigné, un reçu sera envoyé automatiquement.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm">
                Notes
              </Label>
              <div className="relative">
                <StickyNote className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Notes sur le don (optionnel)"
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          )}

          {/* Résumé compact inline */}
          {formData.amount && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Résumé</span> — {formData.amount}€ •
              {calendarAccepted ? " Soutien (pas de déduction)" : ` Fiscal (déduction ${deduction}€)`}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Annuler
            </Button>
            {formData.paymentMethod === 'carte' ? (
              <Button type="button" onClick={handleCardPayment} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Préparation du paiement...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Générer le QR Code
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || !formData.amount || parseFloat(formData.amount) <= 0}
                className={`${calendarAccepted ? "bg-emerald-600 hover:bg-emerald-700" : "bg-sky-600 hover:bg-sky-700"}`}
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
            )}
          </div>
        </form>
        {showQRModal && qrCodeData && (
          <QRCodeModal
            isOpen={showQRModal}
            onClose={() => { setShowQRModal(false); setQRCodeData(null); setIsOpen(false) }}
            intentId={qrCodeData.intentId}
            donationUrl={qrCodeData.url}
            expiresAt={qrCodeData.expiresAt}
          />
        )}
        {showStripeModal && stripeClientSecret && (
          <StripePaymentModal
            isOpen={showStripeModal}
            onClose={() => setShowStripeModal(false)}
            clientSecret={stripeClientSecret}
            amount={amountNumber}
            intentId={stripeIntentId ?? undefined}
          />
        )}
        {showFinalizationModal && pendingTransactionId && (
          <FinalizationOptionsModal
            isOpen={showFinalizationModal}
            onClose={() => setShowFinalizationModal(false)}
            transactionId={pendingTransactionId}
            amount={amountNumber}
            taxDeduction={deduction}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
