"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import QRCode from 'react-qr-code'
import { createPaymentIntent } from "@/app/actions/create-payment-intent"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { toast } from "react-hot-toast"

export function PaymentCardModalDebug({ tourneeId, trigger }: { tourneeId: string; trigger?: ReactNode }) {
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
      const extractedPiId = cs.split('_secret_')[0]
      setPiId(extractedPiId)
      console.log('🔑 PaymentIntent ID:', extractedPiId)
    }
  }

  // Subscribe to realtime insertion of the transaction for this PaymentIntent
  useEffect(() => {
    if (!open || !piId) {
      console.log('⏸️ Realtime listener paused', { open, piId })
      return
    }

    console.log('🎧 Starting Realtime listener for PI:', piId)
    const supabase = createClient()
    const channel = supabase
      .channel(`st-${piId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_transactions',
        filter: `stripe_session_id=eq.${piId}`,
      }, (payload: { new?: { amount?: number | null; supporter_name?: string | null } }) => {
        console.log('🔔 Realtime INSERT received:', payload)
        const amt = payload?.new?.amount ?? null
        const name = payload?.new?.supporter_name ?? null
        const amountLabel = typeof amt === 'number' ? `${amt.toFixed(2)}€` : ''
        const nameLabel = name ? ` • ${name}` : ''
        const message = `Paiement confirmé ${amountLabel}${nameLabel}`.trim()
        console.log('✅ Displaying toast:', message)
        toast.success(message, { duration: 5000 })
        console.log('🚪 Closing modal')
        setOpen(false)
      })
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })

    return () => {
      console.log('🛑 Cleaning up Realtime listener')
      supabase.removeChannel(channel)
    }
  }, [open, piId])

  // Fallback: polling au cas où Realtime n'est pas activé côté DB
  useEffect(() => {
    if (!open || !piId) {
      console.log('⏸️ Polling paused', { open, piId })
      return
    }

    console.log('🔄 Starting polling for PI:', piId)
    const supabase = createClient()
    let cancelled = false

    const check = async () => {
      console.log('🔍 Polling check...')
      const { data, error } = await supabase
        .from('support_transactions')
        .select('id, amount, supporter_name')
        .eq('stripe_session_id', piId)
        .maybeSingle()

      if (error) {
        console.error('❌ Polling error:', error)
        return
      }

      type TxRow = { id: string; amount: number | null; supporter_name: string | null }
      const row = data as TxRow | null
      console.log('📊 Polling result:', row ? 'Found transaction' : 'No transaction yet')

      if (!cancelled && row) {
        const amt = typeof row.amount === 'number' ? `${row.amount.toFixed(2)}€` : ''
        const name = row.supporter_name ? ` • ${row.supporter_name}` : ''
        const message = `Paiement confirmé ${amt}${name}`.trim()
        console.log('✅ Transaction found via polling, displaying toast:', message)
        toast.success(message, { duration: 5000 })
        console.log('🚪 Closing modal')
        setOpen(false)
      }
    }

    const id = setInterval(check, 2000)
    // Premier check rapide
    check()

    return () => {
      console.log('🛑 Cleaning up polling')
      cancelled = true
      clearInterval(id)
    }
  }, [open, piId])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log('🚪 Modal state changing:', open, '→', newOpen)
      setOpen(newOpen)
    }}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="default">💳 Paiement CB (Debug)</Button>}
      </DialogTrigger>
      <DialogContent className="mx-4 w-[min(100vw-2rem,40rem)] max-w-full sm:max-w-lg bg-card text-foreground border border-border rounded-lg p-4 sm:p-6 overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Paiement par carte (Mode Debug)</DialogTitle>
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
              {piId && (
                <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                  <div>PI ID: {piId}</div>
                  <div className="text-muted-foreground">Ouvrez la console pour voir les logs</div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
