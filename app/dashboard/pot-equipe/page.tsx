import { createClient } from "@/lib/supabase/server";

export default async function PotEquipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Pot d&apos;Équipe</h1>
        <p className="text-muted-foreground">Connectez-vous pour voir les informations de votre équipe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Pot d&apos;Équipe</h1>
      <p className="text-muted-foreground">
        Cette page présentera prochainement la transparence du pot d&apos;équipe selon les paramètres de votre équipe.
      </p>
    </div>
  );
}
