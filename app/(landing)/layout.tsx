import { LandingHeaderWrapper } from "@/components/landing/landing-header-wrapper";
import { LandingFooter } from "@/components/landing/landing-footer";
import { StickyDonateButton } from "@/components/landing/sticky-donate-button";
import { CookieConsent } from "@/components/cookie-consent";
import { createClient } from "@/lib/supabase/server";
import { CartProvider } from "@/lib/cart-context";

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    // CartProvider ici garantit un panier unique et partagé sur toutes les
    // pages du groupe (landing) : liste boutique, fiches produits, etc.
    <CartProvider>
      <LandingHeaderWrapper user={user} />
      <main className="pt-14 md:pt-16">
        {children}
      </main>
      <LandingFooter />
      <StickyDonateButton />
      <CookieConsent />
    </CartProvider>
  );
}