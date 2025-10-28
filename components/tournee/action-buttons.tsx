"use client"

import { Button } from "@/components/ui/button"
import { CreditCard, FileText } from "lucide-react"

interface ActionButtonsProps {
  onPaymentCard: () => void
  onDonation: () => void
  disabled?: boolean
}

export function ActionButtons({ 
  onPaymentCard, 
  onDonation, 
  disabled 
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Button 
        size="lg"
        className="h-24 text-lg bg-blue-600 hover:bg-blue-700"
        onClick={onPaymentCard}
        disabled={disabled}
      >
        <CreditCard size={32} />
        <span>PAIEMENT CARTE</span>
      </Button>
      
      <Button 
        size="lg"
        className="h-24 text-lg bg-green-600 hover:bg-green-700"
        onClick={onDonation}
        disabled={disabled}
      >
        <FileText size={32} />
        <span>DON AVEC REÇU</span>
      </Button>
    </div>
  )
}
