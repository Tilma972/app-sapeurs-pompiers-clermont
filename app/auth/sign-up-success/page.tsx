import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

"use client";

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Page() {
  useEffect(() => {
    // Tente d'informer les admins qu'une approbation est requise
    fetch('/api/auth/notify-pending', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json().catch(() => null)
        if (json?.notified) {
          toast.success('Votre demande a été transmise aux administrateurs');
        }
      })
      .catch(() => {})
  }, [])
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Merci pour votre inscription !
              </CardTitle>
              <CardDescription>Veuillez confirmer votre email pour continuer</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Votre demande est maintenant en attente d&apos;approbation par un administrateur. Vous serez notifié par email dès validation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
