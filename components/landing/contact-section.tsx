"use client";

import { PremiumIcon } from "@/components/landing/premium-icon";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Version minimale: email + téléphone + CTA + lien SDIS

export function ContactSection() {
  return (
    <section className="py-16 px-4">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={Mail} variant="gradient" size="md" />
          </div>
          <h2 className="text-3xl font-bold">Contact</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow flex items-start gap-4">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <a href="mailto:contact@amicale-sp-clermont.fr" className="font-medium text-primary hover:underline">
                contact@amicale-sp-clermont.fr
              </a>
              <p className="text-xs text-muted-foreground mt-1">Réponse sous 48h</p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow flex items-start gap-4">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <a href="tel:+33467XXXXXX" className="font-medium text-primary">
                +33 4 67 XX XX XX
              </a>
              <p className="text-xs text-muted-foreground mt-1">Mer. 18h-20h • Permanence</p>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" asChild>
            <Link href="/contact">Envoyer un message</Link>
          </Button>
        </div>

        <Card className="mt-8 border-l-4 border-l-primary">
          <div className="p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Pour toute urgence ou information officielle</p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.sdis34.fr" target="_blank" rel="noopener noreferrer">
                SDIS 34
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}


