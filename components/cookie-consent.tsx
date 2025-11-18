"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

/**
 * Banner de consentement cookies RGPD
 *
 * Simplifié car le site n'utilise que des cookies techniques essentiels:
 * - Préférence de thème (light/dark)
 * - Session utilisateur (si connecté)
 *
 * Pas de cookies de tracking/analytics/publicité
 */

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accepté
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Afficher le banner après un court délai pour ne pas gêner
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    // Même effet car on n'utilise que des cookies techniques essentiels
    // (qui ne nécessitent pas de consentement selon RGPD)
    localStorage.setItem('cookie-consent', 'rejected');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 shadow-2xl">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Texte */}
          <div className="flex-1 text-white">
            <h3 className="font-semibold text-lg mb-2">
              🍪 Cookies et confidentialité
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Ce site utilise uniquement des <strong>cookies techniques essentiels</strong> pour mémoriser vos préférences (thème clair/sombre).{' '}
              <strong>Aucun cookie de suivi ou de publicité</strong> n&apos;est utilisé.{' '}
              <Link href="/mentions-legales" className="underline hover:text-primary transition-colors">
                En savoir plus
              </Link>
            </p>
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
              aria-label="Refuser les cookies (fermer)"
            >
              Refuser
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label="Accepter les cookies"
            >
              Accepter
            </button>
            <button
              onClick={handleReject}
              className="p-2 text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
