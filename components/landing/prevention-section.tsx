"use client";

import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { Shield, Phone, MessageCircle } from "lucide-react";
import React from "react";
import EmergencyGuideModal from "@/components/landing/emergency-guide-modal";
import { GuideKey } from "@/lib/emergency-guides";

const emergencyNumbers = [
  { number: "18", service: "Sapeurs-Pompiers", description: "Incendies, accidents, secours" },
  { number: "15", service: "SAMU", description: "Urgences médicales" },
  { number: "112", service: "Numéro européen", description: "Urgence depuis mobile" }
];

// Conseils détaillés fournis via modal interactive

export function PreventionSection() {
  const [open, setOpen] = React.useState(false);
  const [initial, setInitial] = React.useState<GuideKey>("18");

  const openGuide = (key: GuideKey) => {
    // Analytics: lightweight, best-effort push to common providers (typed safely)
    if (typeof window !== "undefined") {
      try {
        type AnalyticsWindow = Window & {
          dataLayer?: { push: (...args: unknown[]) => void }
          gtag?: (...args: unknown[]) => void
          plausible?: (event: string, opts?: Record<string, unknown>) => void
        }
        const win = window as unknown as AnalyticsWindow
        const payload = { event: "guide_open", guide: key }

        if (win.dataLayer && typeof win.dataLayer.push === "function") {
          win.dataLayer.push(payload)
        } else if (typeof win.gtag === "function") {
          win.gtag("event", "select_content", { content_type: "guide", item_id: key })
        } else if (typeof win.plausible === "function") {
          win.plausible("Guide Opened", { props: { guide: key } })
        } else {
          console.debug("analytics: guide_open", payload)
        }
      } catch {
        // swallow analytics errors
      }
    }

    setInitial(key)
    setOpen(true)
  }

  return (
    <section id="prevention" className="py-12 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="max-w-[1920px] mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={Shield} variant="gradient" size="md" className="icon-shield" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Numéros d&apos;urgence</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En cas d&apos;urgence, composez le bon numéro
          </p>
        </div>

        {/* Numéros d'urgence - enhanced cards with call action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3 max-w-4xl mx-auto">
            {emergencyNumbers.map((emergency, index) => (
              <motion.div
                key={emergency.number}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="glass-card p-5 sm:p-4 text-center rounded-lg min-h-[240px] sm:min-h-[220px] flex flex-col justify-between items-center group hover:shadow-xl transition-shadow"
              >
                <div className="flex-1 flex flex-col justify-center items-center">
                  {/* Icône téléphone */}
                  <div className="mb-3 flex justify-center">
                    <PremiumIcon
                      icon={Phone}
                      variant="glow"
                      size="md"
                      className="icon-heart"
                    />
                  </div>

                  {/* Numéro en très grand */}
                  <div className="text-5xl sm:text-4xl font-bold text-primary mb-2 tracking-tight">
                    {emergency.number}
                  </div>

                  {/* Service */}
                  <h4 className="text-lg sm:text-base font-semibold text-foreground mb-1">
                    {emergency.service}
                  </h4>

                  {/* Description */}
                  <p className="text-sm sm:text-xs text-muted-foreground mb-4">
                    {emergency.description}
                  </p>
                </div>

                {/* Double CTA - Appeler + Script */}
                <div className="w-full space-y-2">
                  {/* Bouton principal - Appeler */}
                  <a
                    href={`tel:${emergency.number}`}
                    className="w-full px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={`Appeler le ${emergency.number} - ${emergency.service}`}
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">Appeler le {emergency.number}</span>
                  </a>

                  {/* Bouton secondaire - Script */}
                  <button
                    onClick={() => openGuide(emergency.number as GuideKey)}
                    className="w-full px-4 py-2.5 bg-transparent border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/10 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={`Voir le script d'appel pour le ${emergency.number}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">Que dire au {emergency.number} ?</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Indication pédagogique */}
          <p className="text-center text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
            💡 <strong>Nouveau ici ?</strong> Consultez les scripts d&apos;appel pour savoir quelles informations donner aux secours, même avant d&apos;en avoir besoin.
          </p>
        </motion.div>

        <EmergencyGuideModal open={open} onOpenChange={setOpen} initial={initial} />
        </div>
      </div>
    </section>
  );
}


