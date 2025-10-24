"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QRCodeSVG } from "qrcode.react"
import { createCheckoutSession } from "@/app/actions/create-checkout-session"
import { Checkbox } from "@/components/ui/checkbox"

export function PaymentCardModal({ tourneeId }: { tourneeId: string }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>("")
  const [calendarGiven, setCalendarGiven] = useState<boolean>(true)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onGenerate = async () => {
    setError(null)
    const amt = parseFloat(amount)
    const res = await createCheckoutSession({ amount: isFinite(amt) ? amt : 0, calendarGiven, tourneeId })
    if ((res as { error?: string }).error) setError((res as { error?: string }).error!)
    const url = (res as { url?: string }).url
    if (url) setCheckoutUrl(url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">💳 Paiement CB</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card text-foreground border border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Paiement par carte</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Montant (€)</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="30" />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 text-sm">
                <Checkbox id="calendarGivenCB" checked={calendarGiven} onCheckedChange={(v) => setCalendarGiven(!!v)} />
                <Label htmlFor="calendarGivenCB" className="text-sm text-muted-foreground">Calendrier remis</Label>
              </div>
            </div>
          </div>

          {!checkoutUrl ? (
            <div className="flex justify-end">
              <Button className="h-9" onClick={onGenerate}>Générer QR paiement</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <QRCodeSVG value={checkoutUrl} size={200} />
              <a className="text-sm text-primary underline" href={checkoutUrl} target="_blank" rel="noreferrer">Ouvrir dans le navigateur</a>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
