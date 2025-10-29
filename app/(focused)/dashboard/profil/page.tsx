import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { ProfileWithTeamId } from "@/lib/types/profile";
import { ProfileForm } from "@/components/profile-form";
import { User, Shield, Building } from "lucide-react";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/dashboard");

  // Charger les équipes actives pour le Select dynamique
  const { data: teams } = await supabase
    .from('equipes')
    .select('id, nom')
    .eq('actif', true)
    .order('ordre_affichage', { ascending: true });

  return (
    <FocusedContainer>
      {/* Informations actuelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span>Informations actuelles</span>
          </CardTitle>
          <CardDescription>
            Vos informations de profil dans l&apos;Amicale des Sapeurs-Pompiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nom complet</Label>
              <div className="p-3 bg-muted rounded-md border">
                <span className="font-medium text-foreground">{profile.full_name}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <div className="p-3 bg-muted rounded-md border">
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Rôle</Label>
              <div className="p-3 bg-muted rounded-md border">
                <Badge variant="outline" className="px-2 py-0.5">
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.role}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Équipe/Caserne</Label>
              <div className="p-3 bg-muted rounded-md border">
                {(() => {
                  const teamId = (profile as ProfileWithTeamId).team_id
                  const teamName = teamId ? (teams as Array<{ id: string; nom: string }> | undefined)?.find((t) => t.id === teamId)?.nom : undefined
                  const label = teamName || profile.team || undefined
                  return label ? (
                    <Badge variant="outline" className="px-2 py-0.5">
                      <Building className="h-3 w-3 mr-1" />
                      {label}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground italic">Non renseigné</span>
                  )
                })()}
              </div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Membre depuis :</span>{" "}
                {new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div>
                <span className="font-medium">Dernière mise à jour :</span>{" "}
                {new Date(profile.updated_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de modification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span>Modifier mes informations</span>
          </CardTitle>
          <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} teamOptions={(teams as Array<{ id: string; nom: string }>) || []} />
        </CardContent>
      </Card>
    </FocusedContainer>
  );
}
