"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateProfileData = {
  first_name: string;
  last_name: string;
  team_id: string;
  phone?: string | null;
};

export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  // Validation
  if (!data.first_name?.trim() || !data.last_name?.trim()) {
    return { error: "Le prénom et le nom sont requis" };
  }

  if (!data.team_id) {
    return { error: "L'équipe est requise" };
  }

  // Vérifier si c'est une première inscription (profil incomplet)
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("first_name, last_name, team_id, role")
    .eq("id", user.id)
    .single();

  const isNewRegistration =
    !currentProfile?.first_name || !currentProfile?.last_name || !currentProfile?.team_id;

  // Préparer les données à mettre à jour
  const updateData: {
    first_name: string;
    last_name: string;
    team_id: string;
    phone?: string | null;
    role?: string;
  } = {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    team_id: data.team_id,
    phone: data.phone ?? null,
  };

  // Si c'est une nouvelle inscription, mettre le rôle en "pending"
  if (isNewRegistration) {
    updateData.role = "pending";
  }

  // Mettre à jour le profil
  const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: "Erreur lors de l'enregistrement du profil" };
  }

  // Si c'est une nouvelle inscription, notifier les admins
  if (isNewRegistration) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/notify-pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          fullName: `${data.first_name} ${data.last_name}`,
        }),
      });
    } catch (notifyError) {
      console.error("Error notifying admins:", notifyError);
      // Ne pas bloquer l'inscription si la notification échoue
    }
  }

  // Revalider les pages concernées
  revalidatePath("/dashboard/profil");
  revalidatePath("/(pwa)/dashboard/profil", "page");
  revalidatePath("/dashboard");

  return { success: true };
}
