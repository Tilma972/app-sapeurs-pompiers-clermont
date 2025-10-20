"use client";

import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    value: 1234,
    subtitle: "+12% vs 2023",
    colorToken: "text-destructive", // Token shadcn
    ariaLabel: "1234 interventions réalisées en 2024, soit une augmentation de 12% par rapport à 2023"
  },
  {
    icon: Users,
    label: "Sapeurs-pompiers",
    value: 45,
    subtitle: "Centre de secours",
    colorToken: "text-accent", // Couleur d'accent du thème
    ariaLabel: "45 sapeurs-pompiers actifs au Centre de secours de Clermont-l\'Hérault"
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
      <section id="stats" className="py-16 px-4 bg-muted/30" aria-labelledby="stats-heading">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Activité opérationnelle</Badge>
            <h2 id="stats-heading" className="text-3xl md:text-4xl font-bold mb-4">Centre de Secours Clermont-l&#39;Hérault</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Quelques chiffres sur l&#39;activité de notre centre de secours, en complément des informations officielles du SDIS 34
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8" role="list" aria-label="Statistiques opérationnelles">
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
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Icon className={`h-8 w-8 ${stat.colorToken}`} aria-hidden="true" />
                      </div>
                      <dl>
                        <dt className="sr-only">{stat.label}</dt>
                        <dd>
                          <CardTitle className="text-3xl font-bold mt-2" aria-label={stat.ariaLabel}>
                            {formattedValue}
                          </CardTitle>
                        </dd>
                        <dt>
                          <CardDescription className="text-base font-medium">{stat.label}</CardDescription>
                        </dt>
                      </dl>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ces statistiques sont communiquées à titre informatif par l&#39;Amicale. Pour les données officielles complètes et l&#39;ensemble des missions du SDIS 34, consultez le site officiel.
                  </p>
                  <p className="text-xs text-muted-foreground/80 italic">
                    Dernière mise à jour : {formatUpdateDate(metadata.lastUpdated)}{metadata.source && ` • Source : ${metadata.source}`}
                  </p>
                  <a href="https://www.sdis34.fr" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">
                    Visiter le site du SDIS 34
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div className="hidden md:flex w-20 h-20 bg-muted rounded-lg items-center justify-center text-xs text-center text-muted-foreground flex-shrink-0" aria-label="Emplacement réservé pour le logo du SDIS 34">
                  Logo<br />SDIS 34
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MotionConfig>
  );
}
