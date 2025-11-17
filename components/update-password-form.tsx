"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { type EmailOtpType } from "@supabase/supabase-js";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Vérifier le token OTP au chargement de la page
  useEffect(() => {
    const verifyToken = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;

      // Si pas de token, on suppose que l'utilisateur est déjà authentifié (depuis la route /auth/confirm)
      if (!token_hash || !type) {
        setIsVerifying(false);
        return;
      }

      const supabase = createClient();

      try {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash,
        });

        if (error) {
          setVerificationError(error.message);
        }
      } catch (err) {
        setVerificationError(err instanceof Error ? err.message : "Erreur lors de la vérification");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Petit délai pour s'assurer que la session est mise à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirection vers le dashboard avec remplacement de l'historique
      router.replace("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un message de chargement pendant la vérification du token
  if (isVerifying) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Vérification...</CardTitle>
            <CardDescription>
              Vérification de ton lien de réinitialisation en cours...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Afficher une erreur si la vérification a échoué
  if (verificationError) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Erreur</CardTitle>
            <CardDescription>
              Impossible de vérifier ton lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500 mb-4">{verificationError}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Le lien de réinitialisation est peut-être expiré ou invalide.
            </p>
            <Button
              onClick={() => router.push("/auth/forgot-password")}
              className="w-full"
            >
              Demander un nouveau lien
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Choisis un nouveau mot de passe pour continuer l&apos;aventure avec l&apos;amicale&nbsp;!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nouveau mot de passe"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Valider le nouveau mot de passe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
