"use client";

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { resendReceiptAction } from '@/app/actions/receipt-actions'
import { Mail } from 'lucide-react'

type Props = {
  transactionId: string
  disabled?: boolean
}

export function ResendReceiptButton({ transactionId, disabled }: Props) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          const p = toast.loading('Renvoi du reçu…')
          try {
            const res = await resendReceiptAction(transactionId)
            if (res.success) {
              toast.success(res.message || 'Reçu renvoyé', { id: p })
            } else if ('skipped' in res && (res as { skipped: true }).skipped) {
              toast("Envoi désactivé (clé API manquante)", { id: p })
            } else {
              toast.error(res.errors?.[0] || "Impossible d'envoyer le reçu", { id: p })
            }
          } catch {
            toast.error("Erreur serveur", { id: p })
          }
        })
      }}
      title="Renvoyer le reçu par email"
    >
      <Mail className="h-3.5 w-3.5 mr-1" />
      Renvoyer
    </Button>
  )
}
