"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label unused; FormLabel provides label styling
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateUserProfileClient } from "@/lib/supabase/profile-client";
import { Profile } from "@/lib/types/profile";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileFormProps {
  profile: Profile;
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Nom trop court").max(80, "Nom trop long"),
  team: z
    .string()
    .trim()
    .max(80, "Nom d'équipe trop long")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile.full_name || "",
      team: profile.team || "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const onSubmit = async (values: FormValues) => {
    setMessage(null);
    try {
      const updated = await updateUserProfileClient({
        full_name: values.full_name,
        team: values.team ?? null,
      });
      if (updated) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
        setTimeout(() => router.refresh(), 1200);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Une erreur est survenue' });
    }
  };

  return (
  <Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet *</FormLabel>
              <FormControl>
                <Input placeholder="Votre nom complet" {...field} />
              </FormControl>
              <FormDescription>Votre nom tel qu&apos;il apparaîtra dans l&apos;application</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="team"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Équipe/Caserne</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Caserne de Paris 15e" {...field} />
              </FormControl>
              <FormDescription>Votre caserne ou équipe (optionnel)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Boutons d'action (mobile-first) */}
      <div className="pt-4 border-t flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => router.back()}
          disabled={form.formState.isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
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
    </Form>
  );
}
