"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const footerLinks = {
  "L&apos;Amicale": [
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
    { name: "Documentation", href: "#docs" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" },
    { name: "Mentions légales", href: "#legal" }
  ]
};


export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-10">
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
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  Amicale SP
                </h3>
                <p className="text-sm text-slate-400">
                  Clermont l&apos;Hérault
                </p>
              </div>
            </Link>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Une communauté de sapeurs-pompiers dédiée à la protection 
              et au service de notre territoire avec courage et professionnalisme.
            </p>
            <ThemeSwitcher />
          </motion.div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold mb-4 text-white">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-300 hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
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
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Adresse</p>
                <p className="text-slate-300">Amicale SP Clermont l&apos;Hérault</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Téléphone</p>
                <p className="text-slate-300">04 67 44 99 70</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-slate-300">contact@pompiers34800.com</p>
              </div>
            </div>
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
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Amicale des Sapeurs-Pompiers de Clermont l&apos;Hérault. 
            Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="#privacy" className="text-slate-400 hover:text-primary transition-colors">
              Confidentialité
            </Link>
            <Link href="#terms" className="text-slate-400 hover:text-primary transition-colors">
              Conditions
            </Link>
            <Link href="#cookies" className="text-slate-400 hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
