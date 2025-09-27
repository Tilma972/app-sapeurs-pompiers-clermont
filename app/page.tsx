import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { MissionSection } from "@/components/landing/mission-section";
import { TeamSection } from "@/components/landing/team-section";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeaderWrapper } from "@/components/landing/landing-header-wrapper";

export default async function Home() {
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
      <main className="relative">
        {/* Hero Section avec glassmorphism */}
        <HeroSection />
        
        {/* Section Missions */}
        <MissionSection />
        
        {/* Section Équipes */}
        <TeamSection />
        
        {/* Section CTA avec transition vers auth */}
        <CTASection />
      </main>
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
