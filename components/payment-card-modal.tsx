"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QRCodeSVG } from "qrcode.react"

export function PaymentCardModal({ onCreateCheckout }: { onCreateCheckout: (amount: number, calendarGiven: boolean) => Promise<{ url?: string; error?: string }> }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>("")
  const [calendarGiven, setCalendarGiven] = useState<boolean>(true)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onGenerate = async () => {
    setError(null)
    const amt = parseFloat(amount)
    const res = await onCreateCheckout(isFinite(amt) ? amt : 0, calendarGiven)
    if (res.error) setError(res.error)
    if (res.url) setCheckoutUrl(res.url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">💳 Paiement CB</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paiement par carte</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Montant (€)</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="30" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={calendarGiven} onChange={(e) => setCalendarGiven(e.target.checked)} />
                Calendrier remis
              </label>
            </div>
          </div>

          {!checkoutUrl ? (
            <div className="flex justify-end">
              <Button onClick={onGenerate}>Générer QR paiement</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <QRCodeSVG value={checkoutUrl} size={200} />
              <a className="text-sm text-blue-600 underline" href={checkoutUrl} target="_blank" rel="noreferrer">Ouvrir dans le navigateur</a>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
