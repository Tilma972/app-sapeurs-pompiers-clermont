"use client";

import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Users, Timer, TrendingUp, type LucideIcon } from "lucide-react";

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
    icon: TrendingUp,
    label: "Temps moyen",
    value: "8 min",
    subtitle: "Délai d\'intervention",
    colorToken: "text-primary",
    ariaLabel: "Temps moyen d\'intervention de 8 minutes"
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
      <section id="stats" className="py-12 px-4 bg-muted/30" aria-labelledby="stats-heading">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-6">
            <Badge variant="outline" className="mb-2">Activité opérationnelle</Badge>
            <h2 id="stats-heading" className="text-2xl md:text-3xl font-bold">Centre de Secours Clermont-l&#39;Hérault</h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6" role="list" aria-label="Statistiques opérationnelles">
            {operationalStats.map((stat, index) => {
              const Icon = stat.icon;
              const formattedValue = formatNumber(stat.value);
              return (
                <motion.div
                  key={`stat-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: shouldReduceMotion ? 0 : index * 0.1, duration: shouldReduceMotion ? 0 : 0.4 }}
                  role="listitem"
                >
                  <Card className="h-full p-4 hover:shadow-md transition-shadow">
                    <Icon className={`h-6 w-6 mb-2 ${stat.colorToken}`} aria-hidden="true" />
                    <p className="text-2xl font-bold" aria-label={stat.ariaLabel}>{formattedValue}</p>
                    <p className="text-xs font-medium">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{stat.subtitle}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Disclaimer compact */}
          <p className="text-xs text-muted-foreground text-center">
            Données indicatives • Dernière maj {formatUpdateDate(metadata.lastUpdated)} •
            <a href="https://www.sdis34.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">SDIS 34</a>
          </p>
        </div>
      </section>
    </MotionConfig>
  );
}
