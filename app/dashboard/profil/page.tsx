import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserProfile } from "@/lib/supabase/profile";
import { ProfileForm } from "@/components/profile-form";
import { User, Shield, Building } from "lucide-react";

export default async function ProfilPage() {
  const supabase = await createClient();
  
  // Vérification de l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Récupération du profil utilisateur
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mon Profil</h1>
            <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles</p>
          </div>
        </div>
      </div>
        {/* Section d'informations actuelles */}
        <div className="mb-8">
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
                    {profile.team ? (
                      <Badge variant="outline" className="px-2 py-0.5">
                        <Building className="h-3 w-3 mr-1" />
                        {profile.team}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Non renseigné</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Membre depuis :</span>{" "}
                    {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Dernière mise à jour :</span>{" "}
                    {new Date(profile.updated_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire de modification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <span>Modifier mes informations</span>
            </CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>
    </div>
  );
}
