import { PwaContainer } from "@/components/layouts/pwa/pwa-container"
import { TourneeStatusCard } from "@/components/tournee/tournee-status-card"
import { MaTourneeClient } from "@/components/tournee/ma-tournee-client"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getActiveTourneeWithTransactions } from "@/lib/supabase/tournee"
import { PaymentCardModal } from "@/components/payment-card-modal"
import { ReceiptGenerationModal } from "@/components/receipt-generation-modal"
import { TourneeClotureModal } from "@/components/tournee/tournee-cloture-modal"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MaTourneePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Récupérer le secteur de l'équipe de l'utilisateur
  const { data: profile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();

  let userSecteur: string | null = null;
  if (profile?.team_id) {
    const { data: equipe } = await supabase
      .from("equipes")
      .select("secteur")
      .eq("id", profile.team_id)
      .single();
    userSecteur = equipe?.secteur || null;
  }

  const tourneeData = await getActiveTourneeWithTransactions()

  // Pas de tournée active
  if (!tourneeData || !tourneeData.tournee) {
    return (
      <PwaContainer>
        <TourneeStatusCard status="inactive" count={0} amount={0} />

        {/* Badge cliquable du secteur si assigné */}
        {userSecteur && <MaTourneeClient secteur={userSecteur} />}

        <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-4">
          <Button size="lg" disabled className="h-20 sm:h-24 text-base sm:text-lg w-full">
            💳 PAIEMENT CARTE
          </Button>
          <Button size="lg" disabled variant="outline" className="h-20 sm:h-24 text-base sm:text-lg w-full">
            🧾 DON AVEC REÇU
          </Button>
        </div>
      </PwaContainer>
    )
  }

  const { tournee, summary } = tourneeData
  const calendars = summary?.calendars_distributed || 0
  const amount = summary?.montant_total || 0
  const startTime = new Date(tournee.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  return (
    <>
      <PwaContainer>
        <TourneeStatusCard
          status="active"
          startTime={startTime}
          count={calendars}
          amount={Math.round(amount)}
        />

        {/* Badge cliquable du secteur si assigné */}
        {userSecteur && <MaTourneeClient secteur={userSecteur} />}

        {/* Gros boutons tactiles - Layout optimisé */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-4">
          <PaymentCardModal
            tourneeId={tournee.id}
            trigger={
              <Button size="lg" className="h-20 sm:h-24 text-base sm:text-lg w-full">
                💳 PAIEMENT CARTE
              </Button>
            }
          />
          <ReceiptGenerationModal
            tourneeId={tournee.id}
            trigger={
              <Button size="lg" variant="outline" className="h-20 sm:h-24 text-base sm:text-lg w-full">
                🧾 DON AVEC REÇU
              </Button>
            }
          />
        </div>
      </PwaContainer>

      {/* Clôture - Séparation visuelle claire */}
      <PwaContainer>
        <TourneeClotureModal
          tourneeId={tournee.id}
          trigger={
            <Button
              size="lg"
              variant="destructive"
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
            >
              🏁 CLÔTURER MA TOURNÉE
            </Button>
          }
        />
      </PwaContainer>
    </>
  )
}
