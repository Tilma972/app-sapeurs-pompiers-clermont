"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import QRCode from 'react-qr-code'
import { createPaymentIntent } from "@/app/actions/create-payment-intent"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { toast } from "react-hot-toast"

export function PaymentCardModal({ tourneeId }: { tourneeId: string }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>("")
  const [calendarGiven, setCalendarGiven] = useState<boolean>(true)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [piId, setPiId] = useState<string | null>(null)

  const onGenerate = async () => {
    setError(null)
    const amt = parseFloat(amount)
    const res = await createPaymentIntent({ amount: isFinite(amt) ? amt : 0, calendarGiven, tourneeId })
    if ((res as { error?: string }).error) setError((res as { error?: string }).error!)
    const url = (res as { url?: string }).url
    if (url) setCheckoutUrl(url)
    const cs = (res as { clientSecret?: string }).clientSecret
    if (cs && cs.includes('_secret_')) {
      setPiId(cs.split('_secret_')[0])
    }
  }

  // Subscribe to realtime insertion of the transaction for this PaymentIntent
  useEffect(() => {
    if (!open || !piId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`st-${piId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_transactions',
        filter: `stripe_session_id=eq.${piId}`,
      }, () => {
        toast.success('Paiement confirmé ✓')
        setOpen(false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, piId])

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
              <QRCode value={checkoutUrl} size={256} level="M" />
              <a className="text-sm text-primary underline" href={checkoutUrl} target="_blank" rel="noreferrer">Ouvrir dans le navigateur</a>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
