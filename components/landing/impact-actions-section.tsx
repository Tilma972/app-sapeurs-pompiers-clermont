"use client";

import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Flame, Users, Timer, TrendingUp, Heart, Calendar, Shield, type LucideIcon } from "lucide-react";
import { PremiumIcon } from "@/components/landing/premium-icon";

// Types stricts avec LucideIcon
interface OperationalStat {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subtitle: string;
  colorToken: string;
  ariaLabel: string;
}

interface StatsMetadata {
  lastUpdated: string;
  source?: string;
}

// Données statiques pour MVP
const operationalStats: OperationalStat[] = [
  {
    icon: Timer,
    label: "Interventions 2024",
    value: 1986,
    subtitle: "+12% vs 2023",
    colorToken: "text-destructive",
    ariaLabel: "1986 interventions réalisées en 2024, soit une augmentation de 12% par rapport à 2023"
  },
  {
    icon: Users,
    label: "Sapeurs-pompiers",
    value: 45,
    subtitle: "Centre de secours",
    colorToken: "text-accent",
    ariaLabel: "45 sapeurs-pompiers actifs au Centre de secours de Clermont-l'Hérault"
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
    subtitle: "Délai d'intervention",
    colorToken: "text-primary",
    ariaLabel: "Temps moyen d'intervention de 8 minutes"
  }
];

const actions = [
  {
    icon: Heart,
    title: "Soutien aux familles",
    description: "Accompagnement et solidarité envers les familles de sapeurs-pompiers",
    color: "icon-heart"
  },
  {
    icon: Users,
    title: "Événements associatifs",
    description: "Organisation d'événements pour renforcer les liens de la communauté",
    color: "icon-users"
  },
  {
    icon: Calendar,
    title: "Collectes solidaires",
    description: "Vente de calendriers et collectes au profit de l'amicale",
    color: "icon-target"
  },
  {
    icon: Shield,
    title: "Sensibilisation prévention",
    description: "Actions de prévention et sensibilisation aux gestes qui sauvent",
    color: "icon-shield"
  }
];

const metadata: StatsMetadata = {
  lastUpdated: "2024-10-15",
  source: "Centre de Secours Clermont-l'Hérault"
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

export function ImpactActionsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion={shouldReduceMotion ? "always" : "never"}>
      <section id="impact-actions" className="py-8 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50" aria-labelledby="impact-heading">
        <div className="container mx-auto max-w-6xl">
          {/* Header unifié */}
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">Notre impact</Badge>
            <h2 id="impact-heading" className="text-2xl md:text-3xl font-bold text-slate-800">
              Centre de Secours Clermont-l'Hérault
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2">
              Nos actions au service de la communauté
            </p>
          </div>

          {/* Stats Grid - Version compacte */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8" role="list" aria-label="Statistiques opérationnelles">
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
                  <Card className="group h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                    <CardHeader className="pb-2">
                      <Icon className={`h-8 w-8 lg:h-10 lg:w-10 ${stat.colorToken} group-hover:scale-110 transition-transform`} aria-hidden="true" />
                      <CardTitle className="text-2xl lg:text-3xl font-bold mt-2" aria-label={stat.ariaLabel}>{formattedValue}</CardTitle>
                      <CardDescription className="text-sm lg:text-base font-medium">{stat.label}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Actions Grid - Version compacte */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {actions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-3 text-center group hover:shadow-md transition-shadow"
              >
                <div className="mb-2 flex justify-center">
                  <PremiumIcon
                    icon={action.icon}
                    variant="glass"
                    size="sm"
                    className={action.color}
                  />
                </div>
                
                <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {action.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Disclaimer compact */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                <div className="hidden lg:flex w-12 h-12 bg-muted rounded-lg items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ces statistiques sont communiquées à titre informatif. Pour les données officielles, consultez le site du SDIS 34.
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Mise à jour : {formatUpdateDate(metadata.lastUpdated)}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                  <a href="https://www.sdis34.fr" target="_blank" rel="noopener noreferrer">
                    SDIS 34
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MotionConfig>
  );
}
