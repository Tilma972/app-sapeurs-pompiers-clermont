"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  ArrowRight,
  CheckCircle,
  Users,
  Shield,
  Heart
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const benefits = [
  {
    icon: Shield,
    title: "Formation continue",
    description: "Accès à des formations professionnelles"
  },
  {
    icon: Users,
    title: "Communauté solidaire",
    description: "Intégration dans une équipe soudée"
  },
  {
    icon: Heart,
    title: "Mission humaine",
    description: "Contribuer au bien-être de la société"
  }
];

const contactInfo = [
  {
    icon: MapPin,
    label: "Adresse",
    value: "Caserne des Sapeurs-Pompiers\nClermont l'Hérault, 34800"
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: "04 67 96 XX XX"
  },
  {
    icon: Mail,
    label: "Email",
    value: "contact@amicale-sp-clermont.fr"
  },
  {
    icon: Clock,
    label: "Disponibilité",
    value: "24h/24 - 7j/7"
  }
];

export function CTASection() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici on pourrait intégrer avec votre système d'emails
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-transparent to-muted/20">
      <div className="container mx-auto px-4">
        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Users className="h-4 w-4" />
            Rejoignez-nous
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Prêt à faire la
            <span className="text-primary"> différence</span> ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Rejoignez notre amicale et participez à la protection de notre communauté. 
            Ensemble, nous pouvons sauver des vies et faire la différence.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Benefits & CTA */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Benefits */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl">Pourquoi nous rejoindre ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Main CTA */}
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Commencez votre aventure
                </h3>
                <p className="text-muted-foreground mb-6">
                  Créez votre compte et découvrez toutes les fonctionnalités de notre PWA.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold group">
                    <Link href="/auth/sign-up">
                      Créer mon compte
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold">
                    <Link href="/auth/login">
                      Se connecter
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info & Newsletter */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Contact Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl">Nous contacter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={info.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{info.label}</h4>
                      <p className="text-muted-foreground text-sm whitespace-pre-line">{info.value}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl">Restez informé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Recevez nos actualités et informations importantes.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full group" disabled={isSubmitted}>
                    {isSubmitted ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Inscrit !
                      </>
                    ) : (
                      <>
                        S'inscrire
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
