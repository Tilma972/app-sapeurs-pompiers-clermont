"use client";

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'
import { createCheckoutSession } from '@/app/actions/card-payments'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export function ClientQR({ tourneeId }: { tourneeId: string }) {
  const [amount, setAmount] = useState('')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'pending' | 'succeeded' | 'failed'>('idle')

  const isValid = useMemo(() => {
    const n = parseFloat(amount)
    return !isNaN(n) && n > 0
  }, [amount])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    try {
      setLoading(true)
      const res = await createCheckoutSession(tourneeId, parseFloat(amount))
      if (res?.success && res.url) {
        setQrUrl(res.url)
        setPaymentId(res.paymentId || null)
        setStatus('pending')
        toast('QR code généré, demandez au donateur de scanner')
      } else {
        toast.error(res?.error || 'Création de session échouée')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!paymentId) return
    const supabase = createBrowserClient()
    const channel = supabase
      .channel('realtime-payments')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'card_payments' }, (payload) => {
        const updated = payload as unknown as { new?: { id?: string; status?: string } }
        if (updated?.new?.id === paymentId && updated?.new?.status === 'succeeded') {
          toast.success('Paiement réussi !')
          setStatus('succeeded')
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [paymentId])

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-lg font-semibold">Paiement par carte (QR)</h1>
      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label className="text-sm font-medium">Montant</label>
          <Input type="number" step="0.50" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button type="submit" disabled={!isValid || loading}>Générer le QR</Button>
      </form>
      {qrUrl && (
        <div className="flex flex-col items-center gap-2">
          <QRCode value={qrUrl} size={220} />
          <div className="flex items-center gap-2 text-xs">
            <a href={qrUrl} target="_blank" rel="noreferrer" className="underline">Ouvrir l’URL</a>
            <button
              type="button"
              className="px-2 py-1 border rounded hover:bg-muted"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(qrUrl)
                  toast('Lien copié')
                } catch {
                  toast.error('Impossible de copier')
                }
              }}
            >Copier</button>
          </div>
          <div className="mt-1 text-xs">
            {status === 'pending' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> En attente du paiement…
              </span>
            )}
            {status === 'succeeded' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Paiement réussi
              </span>
            )}
            {status === 'failed' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-100 text-red-800 px-2 py-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Échec du paiement
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
