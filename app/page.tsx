import { createClient } from "@/lib/supabase/server";
import { HeroSimple } from "@/components/landing/hero-simple";
import { ActionsSection } from "@/components/landing/actions-section";
import { ShopSection } from "@/components/landing/shop-section";
import { PreventionSection } from "@/components/landing/prevention-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { NewsSection } from "@/components/landing/news-section";
import { ContactSection } from "@/components/landing/contact-section";
import { PartnersSection } from "@/components/landing/partners-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeaderWrapper } from "@/components/landing/landing-header-wrapper";
import { OperationsStatsSection } from "@/components/landing/operations-stats-section";
import { SectorMapSection } from "@/components/landing/sector-map-section";

export default async function Home({ searchParams }: { searchParams?: Promise<{ pending?: string }> }) {
  // Vérification intelligente de l'authentification
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Pour tester la landing page, commentons temporairement la redirection
  // if (user) {
  //   redirect("/dashboard");
  // }

  const params = (await searchParams) || {};
  return (
    <div className="min-h-screen">
      {/* Header avec navigation */}
      <LandingHeaderWrapper user={user} />
  {params?.pending === '1' && (
        <div className="mx-auto max-w-5xl px-4">
            <div className="mt-4 rounded-lg border bg-yellow-50 text-yellow-900 p-4 text-sm">
              Votre inscription a bien été enregistrée et est en attente d&apos;approbation par un administrateur. Vous recevrez un email dès validation.
          </div>
        </div>
      )}
      
  {/* Hero Simple avec Ken Burns */}
  <HeroSimple loggedIn={!!user} />
      
          {/* Contenu principal */}
          <main className="relative">
              {/* Statistiques opérationnelles sous le hero */}
              <OperationsStatsSection />

             {/* Carte secteur opérationnel */}
             <SectorMapSection />

              {/* Actions (ultra-compactes) */}
              <ActionsSection />
            
            {/* Section Boutique */}
            <ShopSection />
            
            {/* Prévention: numéros d'urgence */}
            <PreventionSection />

            {/* Témoignages: carrousel */}
            <TestimonialsSection />
            
            {/* Section Actualités */}
            <NewsSection />
            
            {/* Section Partenaires */}
            <PartnersSection />
            
            {/* Contact minimal */}
            <ContactSection />
          </main>
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
