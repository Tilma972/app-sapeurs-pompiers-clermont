/**
 * Carte d'affichage d'une offre partenaire (format liste compact)
 * Design horizontal : Image 80x80, infos inline, badges, chevron
 */

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { OfferWithPartner } from '@/lib/types/avantages.types';
import { ChevronRight } from 'lucide-react';

interface OfferCardProps {
  offer: OfferWithPartner;
}

/**
 * Emoji pour catégorie partenaire
 */
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    restaurant: '🍽️',
    commerce: '🛍️',
    service: '🔧',
    loisir: '🎭',
    sante: '⚕️',
    autre: '🏪',
  };
  return emojiMap[category] || '🏪';
}



export function OfferCard({ offer }: OfferCardProps) {
  const imageUrl = offer.image_url || offer.partner.logo_url || '/placeholder-offer.jpg';

  return (
    <Link href={`/avantages/${offer.id}`} className="block">
      <Card className="flex items-center gap-4 p-4 transition-all hover:shadow-lg hover:border-primary/50">
        {/* Image carrée 80x80 */}
        <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={offer.titre}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* Nom du partenaire */}
          <h3 className="font-bold text-foreground mb-1 truncate">
            {getCategoryEmoji(offer.partner.categorie)} {offer.partner.nom}
          </h3>

          {/* Titre de l'offre (réduction) */}
          <p className="text-primary font-semibold text-sm mb-2 truncate">
            {offer.titre}
          </p>

          {/* Badges catégories */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="secondary" 
              className="text-xs bg-tertiary/20 text-tertiary border-0"
            >
              {offer.partner.ville || 'Local'}
            </Badge>
            <Badge 
              variant="secondary" 
              className="text-xs bg-tertiary/20 text-tertiary border-0"
            >
              {offer.type_avantage === 'qr_code' ? 'QR Code' : 'Code Promo'}
            </Badge>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </Card>
    </Link>
  );
}
