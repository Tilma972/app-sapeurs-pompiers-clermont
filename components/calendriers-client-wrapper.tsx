"use client"

import { useEffect, useState } from "react"
import { CalendarConfirmationModal } from "./calendar-confirmation-modal"

interface CalendriersClientWrapperProps {
  children: React.ReactNode
  needsConfirmation: boolean
  calendriersLotAttribue: number
}

export function CalendriersClientWrapper({
  children,
  needsConfirmation,
  calendriersLotAttribue
}: CalendriersClientWrapperProps) {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Afficher la modale après un court délai pour une meilleure UX
    if (needsConfirmation) {
      const timer = setTimeout(() => {
        setShowModal(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [needsConfirmation])

  return (
    <>
      {children}
      {needsConfirmation && (
        <CalendarConfirmationModal
          open={showModal}
          calendriersLotAttribue={calendriersLotAttribue}
          onConfirmSuccess={() => setShowModal(false)}
        />
      )}
    </>
  )
}
