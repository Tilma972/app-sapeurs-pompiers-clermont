/**
 * Carousel horizontal pour les partenaires mis en avant (featured)
 * Scroll horizontal naturel, cartes style modèle UI
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PartnerWithOffers } from '@/lib/types/avantages.types';
import { Star } from 'lucide-react';

interface FeaturedCarouselProps {
  partners: PartnerWithOffers[];
}

export function FeaturedCarousel({ partners }: FeaturedCarouselProps) {
  if (partners.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-4">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <h2 className="text-lg font-bold">Partenaires à la une</h2>
      </div>

      {/* Carousel scrollable horizontal */}
      <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory scrollbar-hide">
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        
        {partners.map((partner) => (
          <Link 
            key={partner.id} 
            href={`/avantages?partner=${partner.id}`}
            className="block snap-start"
          >
            <Card className="w-72 shrink-0 overflow-hidden transition-shadow hover:shadow-lg">
              {/* Image aspect 3/2 */}
              <div className="relative aspect-[3/2] bg-muted">
                <Image
                  src={partner.logo_url || '/placeholder-partner.jpg'}
                  alt={partner.nom}
                  fill
                  className="object-cover"
                  sizes="288px"
                />
                <Badge 
                  variant="default" 
                  className="absolute top-2 right-2 bg-yellow-500 text-black hover:bg-yellow-600"
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">
                  {partner.nom}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {partner.description || `${partner.activeOffersCount} offre${partner.activeOffersCount > 1 ? 's' : ''} disponible${partner.activeOffersCount > 1 ? 's' : ''}`}
                </p>
                <Button 
                  size="sm" 
                  className="w-full bg-secondary hover:bg-secondary/90"
                >
                  Voir l&apos;offre
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
