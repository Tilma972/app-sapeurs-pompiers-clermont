import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingHeaderWrapper } from "@/components/landing/landing-header-wrapper";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ShopSection } from "@/components/landing/shop-section";

export default async function BoutiquePage() {
  // Vérification intelligente de l'authentification
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      {/* Header avec navigation */}
      <LandingHeaderWrapper user={user} />
      
      {/* Contenu principal */}
      <main className="relative pt-16">
        {/* Section Boutique complète */}
        <ShopSection />
        
        {/* Section informations supplémentaires */}
        <section className="py-20 bg-gradient-to-br from-slate-100 via-amber-50 to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                Comment commander ?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="glass-card p-6 text-center">
                  <div className="text-4xl mb-4">📞</div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    1. Contactez-nous
                  </h3>
                  <p className="text-muted-foreground">
                    Appelez-nous ou envoyez un email avec vos produits souhaités
                  </p>
                </div>
                
                <div className="glass-card p-6 text-center">
                  <div className="text-4xl mb-4">💳</div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    2. Paiement
                  </h3>
                  <p className="text-muted-foreground">
                    Virement bancaire ou paiement à la livraison selon vos préférences
                  </p>
                </div>
                
                <div className="glass-card p-6 text-center">
                  <div className="text-4xl mb-4">🚚</div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    3. Livraison
                  </h3>
                  <p className="text-muted-foreground">
                    Retrait sur place ou livraison locale gratuite dans un rayon de 20km
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
