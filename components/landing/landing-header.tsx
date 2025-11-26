"use client";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { ViewToggle } from "@/components/view-toggle";
import { Menu, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "À Propos", href: "/#actions" },
  { name: "Boutique", href: "/boutique" },
  { name: "Devenir Partenaire", href: "/devenir-partenaire" },
  { name: "Contact", href: "/#contact" },
];

type MinimalUser = { id: string } | null;

interface LandingHeaderProps {
  user: MinimalUser;
}

export function LandingHeader({ user }: LandingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass-header w-full"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-16 max-w-[1920px] mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image
                src="https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/logo/logo_amicale.svg"
                alt="Logo Amicale des Sapeurs-Pompiers"
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
            <div className="block">
              <div className="text-sm sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                Amicale des Sapeurs-Pompiers
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Clermont-l&apos;Hérault
              </p>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {item.name}
                <motion.div
                  className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Connecté
                </span>
                <ViewToggle currentView="landing" variant="default" size="sm" />
                <LogoutButton />
              </div>
            ) : (
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Se connecter
                </Link>
              </Button>
            )}

            {/* Menu Mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden min-h-[44px] min-w-[44px]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Menu Mobile */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden glass-card mt-2 overflow-hidden"
            >
              <nav className="p-4 space-y-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                {user ? (
                  <div onClick={() => setIsMenuOpen(false)}>
                    <ViewToggle currentView="landing" variant="ghost" size="default" />
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="block text-sm font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
