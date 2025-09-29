"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Heart, Zap } from "lucide-react";
import { PremiumIcon } from "@/components/landing/premium-icon";
import Link from "next/link";
import { motion } from "framer-motion";

const heroStats = [
  { icon: Shield, value: "24/7", label: "Disponibilité", variant: "glass" as const, colorClass: "icon-shield" },
  { icon: Users, value: "50+", label: "Membres actifs", variant: "gradient" as const, colorClass: "icon-users" },
  { icon: Heart, value: "100%", label: "Engagement", variant: "glow" as const, colorClass: "icon-heart" },
  { icon: Zap, value: "< 5min", label: "Temps d'intervention", variant: "minimal" as const, colorClass: "icon-zap" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background avec effet glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-red-500/10 to-slate-600/20" />
      
      {/* Éléments décoratifs flottants */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-red-400/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-slate-400/20 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenu principal */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge avec glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-card w-fit">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-primary">
                    <PremiumIcon 
                      icon={Shield} 
                      size="sm" 
                      variant="glass" 
                      className="icon-shield"
                    />
                    <span>Amicale des Sapeurs-Pompiers</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Titre principal */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-4"
            >
              <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-red-900 dark:from-slate-100 dark:via-blue-100 dark:to-red-100 bg-clip-text text-transparent leading-tight">
                Courage,
                <br />
                <span className="text-primary">Solidarité</span>
                <br />
                Excellence
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Rejoignez une communauté de héros du quotidien. 
                Ensemble, nous protégeons et servons notre territoire avec passion et professionnalisme.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href="/auth/sign-up">
                  Rejoindre l&apos;Amicale
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold glass-button">
                <Link href="#missions">
                  Découvrir nos missions
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats avec glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 gap-6"
          >
            {heroStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <Card className="glass-card h-32 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                    <PremiumIcon 
                      icon={stat.icon} 
                      size="md" 
                      variant={stat.variant}
                      className={stat.colorClass}
                    />
                    <div className="text-2xl font-bold text-foreground mt-3">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-primary rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
}
