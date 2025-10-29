import { FocusedContainer } from "@/components/layouts/focused/focused-container"
import { TourneeStatusCard } from "@/components/tournee/tournee-status-card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getActiveTourneeWithTransactions } from "@/lib/supabase/tournee"
import { PaymentCardModal } from "@/components/payment-card-modal"
import { ReceiptGenerationModal } from "@/components/receipt-generation-modal"
import { TourneeClotureModal } from "@/components/tournee-cloture-modal"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MaTourneePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const tourneeData = await getActiveTourneeWithTransactions()

  // Pas de tournée active
  if (!tourneeData || !tourneeData.tournee) {
    return (
      <>
        <FocusedContainer>
          <TourneeStatusCard status="inactive" count={0} amount={0} />
          <div className="grid grid-cols-1 gap-4">
            <Button size="lg" disabled className="h-24 text-lg">PAIEMENT CARTE</Button>
            <Button size="lg" disabled variant="outline" className="h-24 text-lg">DON AVEC REÇU</Button>
          </div>
        </FocusedContainer>
      </>
    )
  }

  const { tournee, transactions, summary } = tourneeData
  const calendars = summary?.calendars_distributed || 0
  const amount = summary?.montant_total || 0
  const startTime = new Date(tournee.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  const now = new Date()
  const started = new Date(tournee.date_debut)
  const durationMin = Math.floor((now.getTime() - started.getTime()) / 60000)
  const dh = Math.floor(durationMin / 60)
  const dm = durationMin % 60
  const durationLabel = `${dh}h ${dm}min`

  return (
    <>
      <FocusedContainer>
        {/* Meta sous le header: durée de la tournée */}
        <div className="flex justify-center">
          <span className="text-sm text-muted-foreground">Durée: {durationLabel}</span>
        </div>
        <TourneeStatusCard 
          status="active"
          startTime={startTime}
          secteur={tournee.zone || undefined}
          count={calendars}
          amount={Math.round(amount)}
        />

        {/* Gros boutons tactiles alimentés par les modales existantes */}
        <div className="grid grid-cols-1 gap-4">
          <PaymentCardModal 
            tourneeId={tournee.id}
            trigger={
              <Button size="lg" className="h-24 text-lg">
                PAIEMENT CARTE
              </Button>
            }
          />
          <ReceiptGenerationModal 
            tourneeId={tournee.id}
            trigger={
              <Button size="lg" variant="outline" className="h-24 text-lg">
                DON AVEC REÇU
              </Button>
            }
          />
        </div>
      </FocusedContainer>

      {/* Clôture intégrée au contenu */}
      <FocusedContainer>
        <TourneeClotureModal
          trigger={
            <Button size="lg" variant="destructive" className="w-full h-14 text-lg">
              🏁 CLÔTURER MA TOURNÉE
            </Button>
          }
          tourneeData={{ tournee, transactions, summary }}
          tourneeSummary={summary}
        />
      </FocusedContainer>
    </>
  )
}
