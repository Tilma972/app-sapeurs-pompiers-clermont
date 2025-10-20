"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const footerLinks = {
  "L'Amicale": [
    { name: "À propos", href: "#about" },
    { name: "Nos missions", href: "#missions" },
    { name: "Nos équipes", href: "#teams" },
    { name: "Actualités", href: "#news" }
  ],
  "Services": [
    { name: "Formation", href: "#formation" },
    { name: "Intervention", href: "#intervention" },
    { name: "Prévention", href: "#prevention" },
    { name: "Support", href: "#support" }
  ],
  "Ressources": [
    { name: "Attestation d’intervention", href: "https://www.sdis34.fr/formulaire-demande-dattestation-dintervention/" },
    { name: "FAQ", href: "#faq" },
    { name: "Mentions légales", href: "#legal" }
  ]
};


export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-10">
        {/* Barre d'actions supprimée sur demande */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="relative w-12 h-12">
                <Image
                  src="https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/logo/logo_amicale.svg"
                  alt="Logo Amicale des Sapeurs-Pompiers"
                  fill
                  sizes="48px"
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors text-foreground">
                  Amicale SP
                </h3>
                <p className="text-sm text-muted-foreground">
                  Clermont l&apos;Hérault
                </p>
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Une communauté de sapeurs-pompiers dédiée à la protection 
              et au service de notre territoire avec courage et professionnalisme.
            </p>
            <ThemeSwitcher />
          </motion.div>

          {/* Footer Links */}
          <nav aria-label="Liens du footer" className="contents">
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="text-base md:text-lg font-semibold mb-4 text-foreground">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="border-t border-slate-700 mt-8 pt-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <a
                  href="https://share.google/DiSyI3Yv2Be98gBzG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
                >
                  15 Rue du Sauvignon, 34800 Clermont-l&apos;Hérault
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <a
                  href="tel:+33467449970"
                  className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
                >
                  04 67 44 99 70
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a
                  href="mailto:contact@amicale-sp-clermont.fr"
                  className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
                >
                  contact@amicale-sp-clermont.fr
                </a>
              </div>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="mt-6 flex gap-4">
            <Link
              href="#facebook"
              aria-label="Facebook"
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Facebook className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="#instagram"
              aria-label="Instagram"
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="border-t border-slate-700 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Amicale des Sapeurs-Pompiers de Clermont l&apos;Hérault. 
            Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="#privacy" className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded">
              Confidentialité
            </Link>
            <Link href="#terms" className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded">
              Conditions
            </Link>
            <Link href="#cookies" className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded">
              Cookies
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
