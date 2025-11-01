"use client";

import { motion } from "framer-motion";
import { Mail, Phone, ExternalLink, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import Link from "next/link";
import { fadeInUp, staggerContainer } from "@/lib/animations";

// Version minimale: email + téléphone + CTA + lien SDIS

export function ContactSection() {
  return (
    <section className="py-12 px-4" id="contact">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-8"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            Contact
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-base text-muted-foreground max-w-2xl mx-auto"
          >
            Une question ou une demande d’information ? Écrivez-nous ou appelez-nous.
          </motion.p>
        </motion.div>

        {/* Grille de contact moderne */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Email</h3>
                <a href="mailto:contact@amicale-sp-clermont.fr" className="text-primary hover:underline font-medium">
                  contact@pompiers34800.com
                </a>
              </div>
            </Card>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Téléphone</h3>
                <a href="tel:+33467449970" className="text-primary hover:underline font-medium">
                  04 67 44 99 70
                </a>
                <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Mer. 18h-20h
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Adresse</h3>
                <p className="text-sm text-muted-foreground">
                  Centre de Secours<br />
                  Clermont-l&apos;Hérault
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* CTA principal */}
        <div className="text-center mb-8">
          <Button size="lg" className="px-8 py-4 text-lg" asChild>
            <a href="mailto:contact@amicale-sp-clermont.fr">
              <Mail className="mr-2 h-5 w-5" />
              Envoyer un message
            </a>
          </Button>
        </div>

        {/* Lien SDIS simplifié */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Pour toute urgence ou information officielle
          </p>
          <Button variant="outline" asChild>
            <a href="https://www.sdis34.fr" target="_blank" rel="noopener noreferrer">
              SDIS 34
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}



