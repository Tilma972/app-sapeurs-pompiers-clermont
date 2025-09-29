"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Award, 
  Clock, 
  Star,
  ArrowRight,
  Shield,
  Zap,
  Heart
} from "lucide-react";
import { PremiumIcon } from "@/components/landing/premium-icon";
import { motion } from "framer-motion";
import Link from "next/link";

const teams = [
  {
    name: "Équipe Intervention",
    role: "Premiers secours & sauvetage",
    experience: "15 ans d'expérience",
    speciality: "Secours routier",
    members: 12,
    icon: Shield,
    variant: "glow" as const,
    colorClass: "icon-shield",
    badges: ["Secours routier", "Désincarcération", "Premiers secours"]
  },
  {
    name: "Équipe Formation",
    role: "Formation & prévention",
    experience: "8 ans d'expérience",
    speciality: "Formation continue",
    members: 8,
    icon: Award,
    variant: "gradient" as const,
    colorClass: "icon-award",
    badges: ["Formation", "Prévention", "Sensibilisation"]
  },
  {
    name: "Équipe Technique",
    role: "Maintenance & innovation",
    experience: "12 ans d'expérience",
    speciality: "Matériel technique",
    members: 6,
    icon: Zap,
    variant: "minimal" as const,
    colorClass: "icon-zap",
    badges: ["Maintenance", "Innovation", "Technique"]
  },
  {
    name: "Équipe Support",
    role: "Logistique & coordination",
    experience: "10 ans d'expérience",
    speciality: "Coordination",
    members: 4,
    icon: Heart,
    variant: "glass" as const,
    colorClass: "icon-heart",
    badges: ["Logistique", "Coordination", "Support"]
  }
];

const stats = [
  { icon: Users, value: "30+", label: "Membres actifs", variant: "glass" as const, colorClass: "icon-users" },
  { icon: Award, value: "100%", label: "Certifiés", variant: "gradient" as const, colorClass: "icon-award" },
  { icon: Clock, value: "24/7", label: "Disponibilité", variant: "minimal" as const, colorClass: "icon-shield" },
  { icon: Star, value: "4.9/5", label: "Satisfaction", variant: "glow" as const, colorClass: "icon-heart" }
];

export function TeamSection() {
  return (
    <section id="teams" className="py-20 bg-gradient-to-b from-muted/20 to-transparent">
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
            <Users className="h-4 w-4" />
            Nos Équipes
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Des professionnels
            <span className="text-primary"> passionnés</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Découvrez les équipes qui composent notre amicale et leurs spécialités.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card text-center hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-3">
                    <PremiumIcon 
                      icon={stat.icon} 
                      size="sm" 
                      variant={stat.variant}
                      className={stat.colorClass}
                    />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Teams Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {teams.map((team, index) => (
            <motion.div
              key={team.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="glass-card h-full hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <PremiumIcon 
                      icon={team.icon} 
                      size="lg" 
                      variant={team.variant}
                      className={team.colorClass}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors mb-2">
                        {team.name}
                      </CardTitle>
                      <p className="text-muted-foreground mb-3">{team.role}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{team.experience}</span>
                        <span>•</span>
                        <span>{team.members} membres</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Spécialité</h4>
                      <p className="text-muted-foreground">{team.speciality}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Compétences</h4>
                      <div className="flex flex-wrap gap-2">
                        {team.badges.map((badge) => (
                          <Badge key={badge} variant="secondary" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
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
          className="text-center"
        >
          <Card className="glass-card max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Rejoignez notre équipe
              </h3>
              <p className="text-muted-foreground mb-6">
                Vous souhaitez contribuer à la protection de notre communauté ? 
                Découvrez comment intégrer nos équipes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="group">
                  <Link href="/auth/sign-up">
                    Candidater
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#contact">
                    En savoir plus
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
