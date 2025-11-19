import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemandeVersementForm } from "@/components/compte/demande-versement-form";
import { getUserCompte } from "@/lib/supabase/compte";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VERSEMENT_CONFIG } from "@/lib/config";

export default async function DemanderVersementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Récupérer le solde disponible
  const compte = await getUserCompte(supabase, user.id);

  const soldeDisponible = compte?.solde_disponible || 0;

  // Vérifier si l'utilisateur a suffisamment de solde
  const hasInsufficientBalance = soldeDisponible < VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT;

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Header avec bouton retour */}
        <div className="space-y-4">
          <Link href="/mon-compte">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à mon compte
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold">Demander un versement</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Demandez le versement de votre rétribution par virement ou carte cadeau
            </p>
          </div>
        </div>

        {/* Alerte si solde insuffisant */}
        {hasInsufficientBalance && (
          <Alert variant="destructive">
            <AlertTitle>Solde insuffisant</AlertTitle>
            <AlertDescription>
              Vous devez avoir au moins {VERSEMENT_CONFIG.MONTANT_MINIMUM_VERSEMENT}€ de solde disponible pour effectuer une demande de versement.
              Votre solde actuel est de {soldeDisponible.toFixed(2)}€.
            </AlertDescription>
          </Alert>
        )}

        {/* Formulaire */}
        {!hasInsufficientBalance && (
          <DemandeVersementForm soldeDisponible={soldeDisponible} />
        )}

        {/* Informations complémentaires */}
        <div className="p-4 rounded-lg border bg-muted/30 text-sm space-y-2">
          <p className="font-medium">Informations importantes</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Le montant demandé sera bloqué immédiatement sur votre compte</li>
            <li>Une fois validée par le trésorier, votre demande sera traitée sous {VERSEMENT_CONFIG.DELAI_TRAITEMENT_JOURS} jours ouvrés</li>
            <li>Vous recevrez une notification par email à chaque étape du traitement</li>
            <li>Les demandes en attente peuvent être annulées depuis votre page "Mon compte"</li>
          </ul>
        </div>
      </div>
    </PwaContainer>
  );
}
