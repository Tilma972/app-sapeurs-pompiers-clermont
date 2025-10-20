"use client";

import { PremiumIcon } from "@/components/landing/premium-icon";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Version minimale: email + téléphone + CTA + lien SDIS

export function ContactSection() {
  return (
    <section className="py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <PremiumIcon icon={Mail} variant="gradient" size="md" />
          </div>
          <h2 className="text-2xl font-bold">Contact</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <a href="mailto:contact@amicale-sp-clermont.fr" className="font-medium text-primary hover:underline">
                contact@amicale-sp-clermont.fr
              </a>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <a href="tel:+33467XXXXXX" className="font-medium text-primary">
                +33 4 67 XX XX XX
              </a>
            </div>
          </Card>
        </div>

        <div className="text-center mt-6">
          <Button asChild>
            <Link href="/contact">Envoyer un message</Link>
          </Button>
        </div>

        <Card className="mt-6 p-4 border-l-4 border-l-primary">
          <p className="text-sm text-muted-foreground mb-2">
            Pour toute urgence ou information officielle
          </p>
          <a
            href="https://www.sdis34.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            Site officiel SDIS 34
            <ExternalLink className="h-3 w-3" />
          </a>
        </Card>
      </div>
    </section>
  );
}

