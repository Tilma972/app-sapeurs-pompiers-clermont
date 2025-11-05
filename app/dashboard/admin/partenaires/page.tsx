import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PartnersManagement } from "@/components/admin/partners-management";

export default async function PartenairesAdminPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Récupérer tous les partenaires sponsors de la landing page
  const { data: partners } = await supabase
    .from("landing_partners")
    .select("*")
    .order("name");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Gestion des Partenaires</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les logos et informations des partenaires affichés sur la page d&apos;accueil
        </p>
      </div>

      <PartnersManagement initialPartners={partners || []} />
    </div>
  );
}
