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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            <p className="text-gray-600 mt-1">Gérez vos informations personnelles</p>
          </div>
        </div>
      </div>
        {/* Section d'informations actuelles */}
        <div className="mb-8">
          <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Informations actuelles</span>
              </CardTitle>
              <CardDescription>
                Vos informations de profil dans l&apos;Amicale des Sapeurs-Pompiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Nom complet</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="font-medium">{profile.full_name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="font-medium">{user.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Rôle</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                      <Shield className="h-3 w-3 mr-1" />
                      {profile.role}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Équipe/Caserne</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    {profile.team ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Building className="h-3 w-3 mr-1" />
                        {profile.team}
                      </Badge>
                    ) : (
                      <span className="text-gray-500 italic">Non renseigné</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
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
        <Card className="bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
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
