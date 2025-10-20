"use client";

import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Flame, Users, Timer, TrendingUp, MapPinned, type LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/landing/animated-counter";

// Types stricts avec LucideIcon
interface OperationalStat {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subtitle: string;
  colorToken: string; // Tokens Tailwind/shadcn au lieu de couleurs hard-coded
  ariaLabel: string; // Pour accessibilité
}

interface StatsMetadata {
  lastUpdated: string; // ISO 8601 ou format lisible
  source?: string;
}

// Données statiques pour MVP - à migrer vers Supabase/JSON ensuite
const operationalStats: OperationalStat[] = [
  {
    icon: Timer,
    label: "Interventions 2024",
    value: 1986,
    subtitle: "+12% vs 2023",
    colorToken: "text-destructive", // Token shadcn
    ariaLabel: "1986 interventions réalisées en 2024, soit une augmentation de 12% par rapport à 2023"
  },
  {
    icon: Users,
    label: "Sapeurs-pompiers",
    value: 45,
    subtitle: "Centre de secours",
    colorToken: "text-accent", // Couleur d'accent du thème
    ariaLabel: "98 sapeurs-pompiers actifs au Centre de secours de Clermont-l\'Hérault"
  },
  {
    icon: Flame,
    label: "Feux maîtrisés",
    value: 89,
    subtitle: "Dont 23 feux de forêt",
    colorToken: "text-orange-600 dark:text-orange-400",
    ariaLabel: "89 feux maîtrisés dont 23 feux de forêt"
  },
  {
    icon: MapPinned,
    label: "Communes servies",
    value: 21,
    subtitle: "Secteur opérationnel",
    colorToken: "text-primary",
    ariaLabel: "21 communes desservies par le centre de secours"
  }
];

const metadata: StatsMetadata = {
  lastUpdated: "2024-10-15", // ISO pour faciliter l'i18n ultérieure
  source: "Centre de Secours Clermont-l\'Hérault"
};

// Fonction utilitaire pour formatter les nombres en français
const formatNumber = (value: number | string): string => {
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(value);
};

// Formatter la date de mise à jour
const formatUpdateDate = (isoDate: string): string => {
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
};

export function OperationsStatsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion={shouldReduceMotion ? "always" : "never"}>
      <section id="stats" className="py-12 px-4 bg-slate-800/30" aria-labelledby="stats-heading">
        <div className="container mx-auto max-w-6xl">
          {/* Header harmonisé */}
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4">Activité opérationnelle</Badge>
            <h2 id="stats-heading" className="text-3xl md:text-4xl font-bold mb-4">Centre de Secours Clermont-l&#39;Hérault</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nos chiffres d&apos;impact en temps réel
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8" role="list" aria-label="Statistiques opérationnelles">
            {operationalStats.map((stat, index) => {
              const Icon = stat.icon;
              // const formattedValue = formatNumber(stat.value);
              return (
                <motion.div
                  key={`stat-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: shouldReduceMotion ? 0 : index * 0.1, duration: shouldReduceMotion ? 0 : 0.4 }}
                  role="listitem"
                >
                  <Card className="group h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <CardHeader className="pb-3">
                      <Icon className={`h-10 w-10 lg:h-12 lg:w-12 ${stat.colorToken} group-hover:scale-110 transition-transform`} aria-hidden="true" />
                      <CardTitle className="text-4xl lg:text-5xl font-bold mt-3" aria-label={stat.ariaLabel}>
                        <AnimatedCounter 
                          value={typeof stat.value === 'number' ? stat.value : 0} 
                          duration={2}
                          className="text-primary"
                        />
                      </CardTitle>
                      <CardDescription className="text-base lg:text-lg font-medium">{stat.label}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stat.label === "Communes servies" ? (
                        <a
                          href="#carte-secteur"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {stat.subtitle}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Disclaimer simplifié avec astérisque */}
          <div className="text-center text-xs text-muted-foreground mt-8">
            <p>
              * Ces statistiques sont communiquées à titre informatif. 
              Pour les données officielles, consultez le site du 
              <a href="https://www.sdis34.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                SDIS 34
              </a>
            </p>
            <p className="mt-1">
              Mise à jour : {formatUpdateDate(metadata.lastUpdated)}
            </p>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
