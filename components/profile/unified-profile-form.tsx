"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";
import { updateProfile } from "@/app/actions/profile/update-profile";
import type { Profile } from "@/lib/types/profile";


interface UnifiedProfileFormProps {
  profile: Profile & { team_id?: string | null; phone?: string | null };
  equipes: Array<{ id: string; nom: string }>;
}

export function UnifiedProfileForm({ profile, equipes }: UnifiedProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Déterminer l'état du profil
  const isNewUser = !profile.first_name || !profile.last_name || !profile.team_id;
  const isPendingApproval = profile.role === "pending";
  const isApproved = profile.role !== "pending";

  const [formData, setFormData] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    team_id: profile.team_id || "",
    phone: profile.phone || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setMessage({ type: "error", text: "Le prénom et le nom sont obligatoires" });
      return;
    }

    if (!formData.team_id) {
      setMessage({ type: "error", text: "Veuillez sélectionner une équipe" });
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        team_id: formData.team_id,
        phone: formData.phone.trim() || null,
      });

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        if (isNewUser) {
          setMessage({
            type: "success",
            text: "Inscription envoyée ! Un administrateur va valider votre compte.",
          });
        } else {
          setMessage({ type: "success", text: "Profil mis à jour avec succès" });
        }
      }
    });
  };

  // État 2 : En attente de validation
  if (!isNewUser && isPendingApproval) {
    return (
      <div className="space-y-6">
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Inscription en attente de validation</strong>
            <p className="mt-1 text-sm">
              Votre demande d&apos;inscription a été envoyée. Un administrateur va vérifier vos
              informations et valider votre compte sous peu.
            </p>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-lg">Informations envoyées</h3>
          
          <div className="grid gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nom complet</p>
              <p className="font-medium">{profile.first_name} {profile.last_name}</p>
            </div>
            
            <div>
              <p className="text-muted-foreground">Équipe</p>
              <p className="font-medium">
                {equipes.find(e => e.id === profile.team_id)?.nom || "Non spécifiée"}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground">Téléphone</p>
              <p className="font-medium">{profile.phone || <span className="italic text-muted-foreground">Non renseigné</span>}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Vous recevrez un email dès que votre compte sera validé.
        </p>
      </div>
    );
  }

  // État 1 (nouvel utilisateur) ou État 3 (utilisateur validé qui modifie)
  return (
    <div className="space-y-6">
      {/* Badge de statut pour utilisateurs validés */}
      {!isNewUser && isApproved && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Compte validé</strong> - Vous pouvez modifier vos informations ci-dessous.
          </AlertDescription>
        </Alert>
      )}

      {/* Message pour nouveaux utilisateurs */}
      {isNewUser && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Complétez votre inscription</strong>
            <p className="mt-1 text-sm">
              Pour accéder à toutes les fonctionnalités, veuillez remplir les informations
              ci-dessous. Votre demande sera validée par un administrateur.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages de feedback */}
      {message && (
        <Alert
          className={
            message.type === "error"
              ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
              : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
          }
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          )}
          <AlertDescription
            className={
              message.type === "error"
                ? "text-red-800 dark:text-red-200"
                : "text-green-800 dark:text-green-200"
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Prénom */}
          <div className="space-y-2">
            <Label htmlFor="first_name">
              Prénom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Jean"
              required
              disabled={isPending}
            />
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="last_name">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Dupont"
              required
              disabled={isPending}
            />
          </div>
        </div>

        {/* Équipe */}
        <div className="space-y-2">
          <Label htmlFor="team_id">
            Équipe <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.team_id}
            onValueChange={(value) => setFormData({ ...formData, team_id: value })}
            disabled={isPending}
          >
            <SelectTrigger id="team_id">
              <SelectValue placeholder="Sélectionnez votre équipe" />
            </SelectTrigger>
            <SelectContent>
              {equipes.map((equipe) => (
                <SelectItem key={equipe.id} value={equipe.id}>
                  {equipe.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="06 12 34 56 78"
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Optionnel - Utile pour vous contacter en cas d&apos;urgence
          </p>
        </div>

        {/* Email (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            L&apos;email ne peut pas être modifié
          </p>
        </div>

        {/* Bouton de soumission */}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : isNewUser ? (
            "Envoyer ma demande d'inscription"
          ) : (
            "Mettre à jour mon profil"
          )}
        </Button>
      </form>
    </div>
  );
}
