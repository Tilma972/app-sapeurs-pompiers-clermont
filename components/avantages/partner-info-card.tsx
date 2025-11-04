/**
 * Carte informations partenaire
 * Affiche adresse, contact, horaires, bouton Google Maps
 */

'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Partner } from '@/lib/types/avantages.types';
import { MapPin, Phone, Mail, Globe, Clock, Navigation } from 'lucide-react';

interface PartnerInfoCardProps {
  partner: Partner;
}

/**
 * Génère l'URL Google Maps
 */
function getGoogleMapsUrl(address?: string | null, city?: string | null): string {
  const query = encodeURIComponent(`${address || ''} ${city || ''}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Traduit les catégories en français
 */
function getCategoryLabel(categorie: Partner['categorie']): { label: string; emoji: string } {
  const labels = {
    restaurant: { label: 'Restaurant', emoji: '🍽️' },
    commerce: { label: 'Commerce', emoji: '🛍️' },
    service: { label: 'Service', emoji: '🔧' },
    loisir: { label: 'Loisir', emoji: '🎭' },
    sante: { label: 'Santé', emoji: '⚕️' },
    autre: { label: 'Autre', emoji: '📦' },
  };
  return labels[categorie];
}

export function PartnerInfoCard({ partner }: PartnerInfoCardProps) {
  const category = getCategoryLabel(partner.categorie);
  const hasAddress = partner.adresse || partner.ville;
  const googleMapsUrl = getGoogleMapsUrl(partner.adresse, partner.ville);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{partner.nom}</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {category.emoji} {category.label}
            </Badge>
          </div>
          {partner.logo_url && (
            <div className="relative h-16 w-16 rounded-lg overflow-hidden border-2 border-border shrink-0">
              <Image
                src={partner.logo_url}
                alt={partner.nom}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {partner.description && (
          <p className="text-sm text-muted-foreground">{partner.description}</p>
        )}

        {/* Contact Info */}
        <div className="space-y-3">
          {/* Address */}
          {hasAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm">
                {partner.adresse && <p>{partner.adresse}</p>}
                {(partner.code_postal || partner.ville) && (
                  <p>
                    {partner.code_postal} {partner.ville}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Phone */}
          {partner.telephone && (
            <a
              href={`tel:${partner.telephone}`}
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{partner.telephone}</span>
            </a>
          )}

          {/* Email */}
          {partner.email && (
            <a
              href={`mailto:${partner.email}`}
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="break-all">{partner.email}</span>
            </a>
          )}

          {/* Website */}
          {partner.site_web && (
            <a
              href={partner.site_web}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
            >
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="break-all">Site web</span>
            </a>
          )}

          {/* Opening hours */}
          {partner.horaires && (
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm whitespace-pre-line">{partner.horaires}</p>
            </div>
          )}
        </div>

        {/* Google Maps Button */}
        {hasAddress && (
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4 mr-2" />
              Itinéraire Google Maps
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
