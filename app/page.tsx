import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  // Si l'utilisateur est déjà connecté, rediriger vers le tableau de bord
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-14 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Amicale SP Clermont l&rsquo;Hérault</Link>
            </div>
            <AuthButton />
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-6 max-w-3xl p-5 text-center">
          <h1 className="text-3xl lg:text-4xl font-semibold">Bienvenue sur l’application de l’Amicale</h1>
          <p className="text-muted-foreground">
            Gérez vos tournées, calendriers, dons et statistiques depuis un tableau de bord simple et moderne.
          </p>
          <div className="mt-6">
            <Link href="/dashboard" className="underline underline-offset-4">Accéder au tableau de bord</Link>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>© {new Date().getFullYear()} Amicale des Sapeurs-Pompiers</p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
