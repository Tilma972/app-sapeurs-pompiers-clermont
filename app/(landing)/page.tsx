import { createClient } from "@/lib/supabase/server";
import { HeroSimple } from "@/components/landing/hero-simple";
import { Missions } from "@/components/landing/Missions";
import { Calendrier } from "@/components/landing/Calendriers";
import { PreventionSection } from "@/components/landing/prevention-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { NewsSection } from "@/components/landing/news-section";
import { ContactSection } from "@/components/landing/contact-section";
import { Partenaires } from "@/components/landing/Partenaires";
import { Stats } from "@/components/landing/Stats";
import { Communes } from "@/components/landing/Communes";
import { landingMetadata } from "./metadata";
import { OrganizationJsonLd } from "@/components/seo/json-ld";

export const metadata = landingMetadata;

export default async function Home({ searchParams }: { searchParams?: Promise<{ pending?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = (await searchParams) || {};
  
  // Récupérer les partenaires sponsors depuis la base de données
  const { data: partners } = await supabase
    .from("landing_partners")
    .select("*")
    .order("name");

  return (
    <div className="min-h-screen">
      {/* Structured Data pour SEO */}
      <OrganizationJsonLd />

      {/* H1 principal pour SEO et accessibilité (caché visuellement) */}
      <h1 className="sr-only">
        Amicale des Sapeurs-Pompiers de Clermont-l&apos;Hérault - Soutien, Solidarité et Actions au service des pompiers
      </h1>

      {params?.pending === '1' && (
        <div className="mx-auto max-w-5xl px-4">
          <div className="mt-4 rounded-lg border bg-yellow-50 text-yellow-900 p-4 text-sm" role="alert">
            Votre inscription a bien été enregistrée et est en attente d&apos;approbation par un administrateur. Vous recevrez un email dès validation.
          </div>
        </div>
      )}
      <HeroSimple loggedIn={!!user} />
      <main className="relative" aria-label="Contenu principal">
        <Stats />
        <Communes />
        <Missions />
        <Calendrier />
        <PreventionSection />
        <TestimonialsSection />
        <NewsSection />
        <Partenaires partners={partners || []} />
        <ContactSection />
      </main>
    </div>
  );
}
