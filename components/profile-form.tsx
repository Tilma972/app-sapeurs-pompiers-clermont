"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Card no longer used; inline alerts replace previous card status
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { updateUserProfileClient } from "@/lib/supabase/profile-client";
import { Profile } from "@/lib/types/profile";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    team: profile.team || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const updatedProfile = await updateUserProfileClient({
        full_name: formData.full_name.trim(),
        team: formData.team.trim() || null,
      });

      if (updatedProfile) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
        // Rafraîchir la page après 2 secondes
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Une erreur est survenue' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message de statut */}
      <div aria-live="polite">
        {message && (
          <Alert className={message.type === 'success' ? 'border-green-600/30 text-foreground' : ''}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertTitle>{message.type === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Champs du formulaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-sm text-muted-foreground">
            Nom complet *
          </Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleInputChange}
            placeholder="Votre nom complet"
            required
            disabled={isLoading}
            className=""
          />
          <p className="text-xs text-muted-foreground">
            Votre nom tel qu&apos;il apparaîtra dans l&apos;application
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="team" className="text-sm text-muted-foreground">
            Équipe/Caserne
          </Label>
          <Input
            id="team"
            name="team"
            type="text"
            value={formData.team}
            onChange={handleInputChange}
            placeholder="Ex: Caserne de Paris 15e"
            disabled={isLoading}
            className=""
          />
          <p className="text-xs text-muted-foreground">
            Votre caserne ou équipe (optionnel)
          </p>
        </div>
      </div>

      {/* Boutons d'action (mobile-first) */}
      <div className="pt-4 border-t flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isLoading || !formData.full_name.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Mise à jour...
            </>
          ) : (
            'Mettre à jour'
          )}
        </Button>
      </div>
    </form>
  );
}
