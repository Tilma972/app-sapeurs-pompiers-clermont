import { createClient } from "@/lib/supabase/server";
import { HeroSimple } from "@/components/landing/hero-simple";
import { Missions } from "@/components/landing/Missions";
import { Calendrier } from "@/components/landing/Calendriers";
import { PreventionSection } from "@/components/landing/prevention-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { NewsSection } from "@/components/landing/news-section";
import { ContactSection } from "@/components/landing/contact-section";
import { Partenaires } from "@/components/landing/Partenaires";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeaderWrapper } from "@/components/landing/landing-header-wrapper";
import { Stats } from "@/components/landing/Stats";
import { Communes } from "@/components/landing/Communes";

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
              <Stats />

             {/* Carte secteur opérationnel */}
             <Communes />

              {/* Missions */}
              <Missions />

            {/* Section Boutique */}
            <Calendrier />
            
            {/* Prévention: numéros d'urgence */}
            <PreventionSection />

            {/* Témoignages: carrousel */}
            <TestimonialsSection />
            
            {/* Section Actualités */}
            <NewsSection />
            
            {/* Section Partenaires */}
            <Partenaires />
            
            {/* Contact minimal */}
            <ContactSection />
          </main>
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
