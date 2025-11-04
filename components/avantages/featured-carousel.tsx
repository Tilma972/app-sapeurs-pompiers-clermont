/**
 * Carousel horizontal pour les partenaires mis en avant (featured)
 * Affiche les partenaires featured avec scroll horizontal
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PartnerWithOffers } from '@/lib/types/avantages.types';
import { ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react';

interface FeaturedCarouselProps {
  partners: PartnerWithOffers[];
}

export function FeaturedCarousel({ partners }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (partners.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? partners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === partners.length - 1 ? 0 : prev + 1));
  };

  const currentPartner = partners[currentIndex];

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <h2 className="text-xl font-bold">Partenaires à la une</h2>
      </div>

      <div className="relative">
        {/* Navigation arrows - desktop only */}
        {partners.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex shadow-lg"
              onClick={handlePrevious}
              aria-label="Partenaire précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex shadow-lg"
              onClick={handleNext}
              aria-label="Partenaire suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Featured Partner Card */}
        <Link href={`/avantages?partner=${currentPartner.id}`}>
          <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative aspect-video md:aspect-square">
                <Image
                  src={currentPartner.logo_url || '/placeholder-partner.jpg'}
                  alt={currentPartner.nom}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <Badge 
                  variant="default" 
                  className="absolute top-3 right-3 bg-yellow-500 text-black hover:bg-yellow-600"
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Partenaire Featured
                </Badge>
              </div>

              {/* Content */}
              <CardContent className="p-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-2">{currentPartner.nom}</h3>
                
                {currentPartner.ville && (
                  <p className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    {currentPartner.ville}
                  </p>
                )}

                {currentPartner.description && (
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {currentPartner.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div>
                    <span className="font-bold text-lg text-foreground">
                      {currentPartner.activeOffersCount}
                    </span>{' '}
                    {currentPartner.activeOffersCount > 1 ? 'offres actives' : 'offre active'}
                  </div>
                </div>

                <Button className="w-full md:w-auto">
                  Découvrir les offres
                </Button>
              </CardContent>
            </div>
          </Card>
        </Link>

        {/* Dots indicator */}
        {partners.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {partners.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Aller au partenaire ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
