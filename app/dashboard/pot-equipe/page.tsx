import { redirect } from "next/navigation";

export default function PotEquipePage() {
  // Route retirée: on redirige vers Mon Compte où le pot d'équipe est affiché
  redirect("/dashboard/mon-compte");
}
