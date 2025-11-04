/**
 * Carte d'affichage d'une offre partenaire
 * Affiche l'image, titre, partenaire, réduction, et CTA
 */

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { OfferWithPartner } from '@/lib/types/avantages.types';
import { QrCode, Tag, MapPin } from 'lucide-react';

interface OfferCardProps {
  offer: OfferWithPartner;
}

/**
 * Badge de réduction (pourcentage ou montant)
 */
function ReductionBadge({ offer }: { offer: OfferWithPartner }) {
  if (offer.reduction_pourcentage) {
    return (
      <Badge variant="destructive" className="absolute top-2 right-2 text-base font-bold shadow-lg">
        -{offer.reduction_pourcentage}%
      </Badge>
    );
  }

  if (offer.reduction_montant) {
    return (
      <Badge variant="destructive" className="absolute top-2 right-2 text-base font-bold shadow-lg">
        -{offer.reduction_montant}€
      </Badge>
    );
  }

  return null;
}

/**
 * Badge type d'avantage (QR Code ou Code Promo)
 */
function TypeBadge({ type }: { type: 'qr_code' | 'code_promo' }) {
  const isQr = type === 'qr_code';
  
  return (
    <Badge 
      variant={isQr ? 'default' : 'secondary'} 
      className="flex items-center gap-1"
    >
      {isQr ? <QrCode className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
      {isQr ? 'QR Code' : 'Code Promo'}
    </Badge>
  );
}

export function OfferCard({ offer }: OfferCardProps) {
  const imageUrl = offer.image_url || offer.partner.logo_url || '/placeholder-offer.jpg';
  const partnerCity = offer.partner.ville || 'Clermont-l\'Hérault';

  return (
    <Link href={`/avantages/${offer.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={offer.titre}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <ReductionBadge offer={offer} />
        </div>

        <CardContent className="p-4">
          {/* Type badge */}
          <div className="mb-2">
            <TypeBadge type={offer.type_avantage} />
          </div>

          {/* Titre */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {offer.titre}
          </h3>

          {/* Partenaire */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
            <div className="flex-1">
              <p className="font-medium text-foreground">{offer.partner.nom}</p>
              <p className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {partnerCity}
              </p>
            </div>
            {offer.partner.logo_url && (
              <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-border">
                <Image
                  src={offer.partner.logo_url}
                  alt={offer.partner.nom}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Description courte */}
          {offer.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {offer.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button className="w-full" variant="default">
            Voir l&apos;offre
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
