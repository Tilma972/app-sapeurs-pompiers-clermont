import { createClient } from "@/lib/supabase/server";
import { LandingHeaderWrapper } from "@/components/landing/landing-header-wrapper";
import { LandingFooter } from "@/components/landing/landing-footer";
import { MissionSection } from "@/components/landing/mission-section";
import { TeamSection } from "@/components/landing/team-section";

export default async function ActionsPage() {
  // Vérification intelligente de l'authentification
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Pour tester la landing page, commentons temporairement la redirection
  // if (user) {
  //   redirect("/dashboard");
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header avec navigation */}
      <LandingHeaderWrapper user={user} />
      
      {/* Contenu principal */}
      <main className="relative pt-16">
        {/* Section Missions détaillées */}
        <MissionSection />
        
        {/* Section Équipes */}
        <TeamSection />
      </main>
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
}



