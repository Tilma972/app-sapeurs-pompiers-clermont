import { createClient } from "@/lib/supabase/server";
import { HeroSimple } from "@/components/landing/hero-simple";
import { ImpactActionsSection } from "@/components/landing/impact-actions-section";
import { ShopSection } from "@/components/landing/shop-section";
import { PreventionSection } from "@/components/landing/prevention-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { NewsSection } from "@/components/landing/news-section";
import { ContactSection } from "@/components/landing/contact-section";
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
    <div className="min-h-screen">
      {/* Header avec navigation */}
      <LandingHeaderWrapper user={user} />
      
  {/* Hero Simple avec Ken Burns */}
  <HeroSimple loggedIn={!!user} />
      
          {/* Contenu principal - Architecture optimisée */}
          <main className="relative">
              {/* Impact + Actions fusionnés */}
              <ImpactActionsSection />
            
            {/* Section Boutique */}
            <ShopSection />
            
            {/* Prévention: numéros d'urgence */}
            <PreventionSection />

            {/* Témoignages: 3 max */}
            <TestimonialsSection />
            
            {/* Section Actualités: 2 max */}
            <NewsSection />
            
            {/* Contact minimal */}
            <ContactSection />
          </main>
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
