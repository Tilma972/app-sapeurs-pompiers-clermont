import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { UnifiedProfileForm } from "@/components/profile/unified-profile-form";
import { User } from "lucide-react";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/dashboard");

  // Charger les équipes actives pour le Select dynamique
  const { data: equipes } = await supabase
    .from("equipes")
    .select("id, nom")
    .eq("actif", true)
    .order("ordre_affichage", { ascending: true });

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Mon Profil</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations personnelles
          </p>
        </div>

        {/* Formulaire unifié */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Complétez ou modifiez vos informations de profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnifiedProfileForm
              profile={profile}
              equipes={(equipes as Array<{ id: string; nom: string }>) || []}
            />
          </CardContent>
        </Card>
      </div>
    </PwaContainer>
  );
}
