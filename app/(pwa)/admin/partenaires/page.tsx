import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PartnersManagement } from "@/components/admin/partners-management";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Building2 } from "lucide-react";

export default async function PartenairesAdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestion des Partenaires"
        description="Gérez les logos et informations des partenaires affichés sur la page d'accueil"
        icon={<Building2 className="h-6 w-6" />}
      />

      <PartnersManagement initialPartners={partners || []} />
    </div>
  );
}
