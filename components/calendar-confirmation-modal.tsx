"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Package, AlertCircle } from "lucide-react"
import { toast } from "react-hot-toast"

interface CalendarConfirmationModalProps {
  open: boolean
  calendriersLotAttribue: number
  onConfirmSuccess?: () => void
}

export function CalendarConfirmationModal({
  open,
  calendriersLotAttribue,
  onConfirmSuccess
}: CalendarConfirmationModalProps) {
  const router = useRouter()
  const [isChecked, setIsChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleConfirm() {
    if (!isChecked) {
      toast.error("Veuillez cocher la case pour confirmer")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/calendars/confirm", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la confirmation")
      }

      toast.success("Réception confirmée ! Vous pouvez maintenant démarrer une tournée.")

      if (onConfirmSuccess) {
        onConfirmSuccess()
      }

      // Recharger la page pour rafraîchir les données
      router.refresh()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la confirmation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {/* Modal non fermable */}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Confirmation de réception</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            Avant de commencer votre tournée, confirmez avoir reçu vos calendriers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nombre de calendriers */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lot attribué</span>
              <span className="text-2xl font-bold text-primary">
                {calendriersLotAttribue} <span className="text-base font-normal">calendriers</span>
              </span>
            </div>
          </div>

          {/* Case à cocher */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="confirm-reception"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked as boolean)}
              disabled={isLoading}
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="confirm-reception"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                Je confirme avoir bien reçu mes {calendriersLotAttribue} calendriers
              </Label>
            </div>
          </div>

          {/* Avertissement */}
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Confirmation requise
              </p>
              <p className="text-amber-800 dark:text-amber-200">
                Vous devez confirmer la réception de vos calendriers pour pouvoir démarrer une tournée.
              </p>
            </div>
          </div>
        </div>

        {/* Bouton de confirmation */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleConfirm}
            disabled={!isChecked || isLoading}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Confirmation...
              </>
            ) : (
              "Confirmer la réception"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
