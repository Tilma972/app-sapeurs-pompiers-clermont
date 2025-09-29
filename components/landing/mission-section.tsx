"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Heart, 
  Users, 
  Zap, 
  Target, 
  Award,
  ArrowRight 
} from "lucide-react";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { motion } from "framer-motion";
import Link from "next/link";

const missions = [
  {
    icon: Shield,
    title: "Protection Civile",
    description: "Intervention rapide et efficace lors d'incidents, accidents et catastrophes naturelles.",
    variant: "glass" as const,
    colorClass: "icon-shield",
    stats: "24/7 Disponible"
  },
  {
    icon: Heart,
    title: "Secours à Personnes",
    description: "Assistance médicale d'urgence, évacuation sanitaire et soutien psychologique.",
    variant: "glow" as const,
    colorClass: "icon-heart",
    stats: "< 5min Intervention"
  },
  {
    icon: Users,
    title: "Formation Continue",
    description: "Perfectionnement des compétences techniques et maintien du niveau opérationnel.",
    variant: "gradient" as const,
    colorClass: "icon-users",
    stats: "100% Certifiés"
  },
  {
    icon: Zap,
    title: "Innovation Technique",
    description: "Adoption des dernières technologies pour optimiser nos interventions.",
    variant: "minimal" as const,
    colorClass: "icon-zap",
    stats: "Tech Avancée"
  },
  {
    icon: Target,
    title: "Prévention",
    description: "Sensibilisation du public aux risques et formation aux gestes de premiers secours.",
    variant: "glass" as const,
    colorClass: "icon-target",
    stats: "500+ Formés/an"
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Engagement constant vers l'amélioration continue de nos services.",
    variant: "gradient" as const,
    colorClass: "icon-award",
    stats: "ISO 9001"
  }
];

export function MissionSection() {
  return (
    <section id="missions" className="py-20 bg-gradient-to-b from-transparent to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Nos Missions
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Au service de la
            <span className="text-primary"> communauté</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Chaque jour, nos sapeurs-pompiers s&apos;engagent avec courage et professionnalisme 
            pour protéger et secourir nos concitoyens.
          </p>
        </motion.div>

        {/* Mission Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {missions.map((mission, index) => (
            <motion.div
              key={mission.title}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="glass-card h-full hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <PremiumIcon 
                      icon={mission.icon} 
                      size="md" 
                      variant={mission.variant}
                      className={mission.colorClass}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {mission.title}
                      </CardTitle>
                      <div className="text-sm text-primary font-medium">
                        {mission.stats}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {mission.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Card className="glass-card max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Prêt à nous rejoindre ?
              </h3>
              <p className="text-muted-foreground mb-6">
                Découvrez comment vous pouvez contribuer à la protection de notre communauté.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="group">
                  <Link href="/auth/sign-up">
                    Rejoindre l&apos;Amicale
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#contact">
                    Nous contacter
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
