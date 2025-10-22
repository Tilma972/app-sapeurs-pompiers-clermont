"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Menu hamburger pour mobile */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 h-8 w-8 p-0"
                onClick={onMenuClick}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Titre de la page */}
        <div className="flex-1">
          {title && (
            <h1 className="text-lg font-semibold text-foreground lg:text-xl">
              {title}
            </h1>
          )}
        </div>

        {/* Actions de l'en-tête (optionnel) */}
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/?view=landing" aria-label="Visiter la page publique">
              <ExternalLink className="mr-2 h-4 w-4" />
              Page publique
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
