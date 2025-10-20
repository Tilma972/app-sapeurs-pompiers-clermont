import { createClient } from "@/lib/supabase/server";
import { HeroSimple } from "@/components/landing/hero-simple";
import { ActionsSection } from "@/components/landing/actions-section";
import { ShopSection } from "@/components/landing/shop-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PreventionSection } from "@/components/landing/prevention-section";
import { NewsSection } from "@/components/landing/news-section";
import { ContactSection } from "@/components/landing/contact-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeaderWrapper } from "@/components/landing/landing-header-wrapper";
import { OperationsStatsSection } from "@/components/landing/operations-stats-section";

export default async function Home() {
  // Vérification intelligente de l'authentification
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Pour tester la landing page, commentons temporairement la redirection
  // if (user) {
  //   redirect("/dashboard");
  // }

  return (
    <div className="min-h-screen">
      {/* Header avec navigation */}
      <LandingHeaderWrapper user={user} />
      
  {/* Hero Simple avec Ken Burns */}
  <HeroSimple loggedIn={!!user} />
      
          {/* Contenu principal */}
          <main className="relative">
            {/* Section Actions de l'amicale */}
            <ActionsSection />

            {/* Section Statistiques Opérationnelles */}
            <OperationsStatsSection />
            
            {/* Section Boutique */}
            <ShopSection />
            
            {/* Section Témoignages */}
            <TestimonialsSection />
            
            {/* Section Prévention */}
            <PreventionSection />
            
            {/* Section Actualités */}
            <NewsSection />
            
            {/* Section Contact */}
            <ContactSection />
          </main>
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
