"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { generateReceiptAction } from "@/app/actions/generate-receipt"
import toast from "react-hot-toast"

export function ReceiptGenerationModal({ tourneeId }: { tourneeId: string }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<"especes" | "cheque">("especes")
  const [calendarGiven, setCalendarGiven] = useState<boolean>(true)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address, setAddress] = useState("")
  const [zip, setZip] = useState("")
  const [city, setCity] = useState("")
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string>("")

  const onSubmit = () => {
    const amt = parseFloat(amount)
    setMessage("")
    if (!isFinite(amt) || amt <= 0) {
      setMessage("Montant invalide")
      return
    }
    if (amt < 6) {
      setMessage("Montant minimum 6€")
      return
    }
    startTransition(async () => {
      const res = await generateReceiptAction({
        tourneeId,
        amount: isFinite(amt) ? amt : 0,
        paymentMethod,
        calendarGiven,
        donorEmail: email,
        donorFirstName: firstName || null,
        donorLastName: lastName || null,
        donorAddress: address || null,
        donorZip: zip || null,
        donorCity: city || null,
      })
      if (res.success) {
        const rn = (res as { receiptNumber?: string }).receiptNumber
        if (res.warning === "email_failed") {
          toast(`Reçu ${rn || ""} généré. Email non envoyé. Utilisez Renvoyer si besoin.`)
        } else {
          toast.success(`Reçu ${rn || ""} envoyé`)
        }
        setOpen(false)
        setAmount("")
      } else {
        setMessage(res.errors?.join("\n") || "Erreur")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">📄 Reçu fiscal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card text-foreground border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Générer un reçu fiscal</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Montant (€)</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25" />
              <p className="text-xs text-muted-foreground mt-1">Minimum 6€</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Mode paiement</Label>
              <div className="flex gap-2 mt-2">
                <Button className="h-9" type="button" variant={paymentMethod === "especes" ? "default" : "outline"} onClick={() => setPaymentMethod("especes")}>Espèces</Button>
                <Button className="h-9" type="button" variant={paymentMethod === "cheque" ? "default" : "outline"} onClick={() => setPaymentMethod("cheque")}>Chèque</Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="calendarGiven" checked={calendarGiven} onCheckedChange={(v) => setCalendarGiven(!!v)} />
            <Label className="text-sm text-muted-foreground" htmlFor="calendarGiven">Calendrier remis</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Prénom</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Nom</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean.dupont@email.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Adresse (optionnel)</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">CP</Label>
                <Input value={zip} onChange={(e) => setZip(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Ville</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
          </div>

          {message && <p className="text-sm text-destructive">{message}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button className="h-9" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button className="h-9" disabled={pending} onClick={onSubmit}>Générer et envoyer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
