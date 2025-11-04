/**
 * Page Détail d'une Offre
 * Affiche hero image, infos partenaire, QR code ou code promo
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { QRCodeCard } from '@/components/avantages/qr-code-card';
import { PromoCodeCard } from '@/components/avantages/promo-code-card';
import { PartnerInfoCard } from '@/components/avantages/partner-info-card';
import { OfferWithPartner } from '@/lib/types/avantages.types';
import { ArrowLeft, ChevronDown, QrCode, Tag, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/formatters';

// Mock data - sera remplacé par getOfferWithPartner()
const MOCK_OFFER: OfferWithPartner = {
  id: '1',
  partner_id: '1',
  titre: '20% de réduction sur l\'addition',
  description: 'Profitez de 20% de réduction sur votre addition (hors boissons). Valable du lundi au jeudi midi et soir. Réservation recommandée.',
  type_avantage: 'qr_code',
  reduction_pourcentage: 20,
  reduction_montant: null,
  code_promo: null,
  qr_code_data: 'LAFORGE-20-SP2024',
  image_url: null,
  conditions: 'Non cumulable avec d\'autres offres promotionnelles.\nRéservation recommandée, surtout le week-end.\nSur présentation de la carte membre valide.\nHors boissons alcoolisées et menu du jour.',
  date_debut: null,
  date_fin: null,
  actif: true,
  ordre_affichage: 1,
  nombre_utilisations: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  partner: {
    id: '1',
    nom: 'Restaurant La Forge',
    description: 'Restaurant traditionnel au cœur de Clermont-l\'Hérault. Cuisine du terroir avec produits locaux de qualité.',
    categorie: 'restaurant',
    logo_url: null,
    adresse: '12 Place de la République',
    code_postal: '34800',
    ville: 'Clermont-l\'Hérault',
    telephone: '04 67 96 00 00',
    email: 'contact@laforge.fr',
    site_web: 'https://laforge.fr',
    horaires: 'Mardi au Dimanche\n12h-14h / 19h-22h\nFermé le lundi',
    actif: true,
    featured: true,
    ordre_affichage: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export default function OfferDetailPage() {
  const router = useRouter();
  const [offer] = useState<OfferWithPartner | null>(MOCK_OFFER);
  const [conditionsOpen, setConditionsOpen] = useState(false);

  // TODO: Remplacer par vraie query
  // const params = useParams();
  // const offerId = params.id as string;
  // useEffect(() => {
  //   async function loadOffer() {
  //     const data = await getOfferWithPartner(offerId);
  //     setOffer(data);
  //     // Track view
  //     if (data && userId) {
  //       await trackOfferUsage(offerId, userId, 'view');
  //     }
  //   }
  //   loadOffer();
  // }, [offerId]);

  const handleQRGenerate = async () => {
    // TODO: Track QR generation
    // await trackOfferUsage(offer.id, userId, 'qr_generation');
    console.log('QR generated - tracking needed');
  };

  const handleCodeCopy = async () => {
    // TODO: Track code copy
    // await trackOfferUsage(offer.id, userId, 'code_copy');
    console.log('Code copied - tracking needed');
  };

  if (!offer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Offre introuvable ou non disponible.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const imageUrl = offer.image_url || offer.partner.logo_url || '/placeholder-offer.jpg';
  const isQRCode = offer.type_avantage === 'qr_code';

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec bouton retour */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-muted">
        <Image
          src={imageUrl}
          alt={offer.titre}
          fill
          className="object-cover"
          priority
        />
        {/* Overlay avec réduction */}
        {offer.reduction_pourcentage && (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="text-xl font-bold py-2 px-4 shadow-lg">
              -{offer.reduction_pourcentage}%
            </Badge>
          </div>
        )}
        {offer.reduction_montant && (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="text-xl font-bold py-2 px-4 shadow-lg">
              -{offer.reduction_montant}€
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Titre et badges */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={isQRCode ? 'default' : 'secondary'}>
                  {isQRCode ? (
                    <>
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Code
                    </>
                  ) : (
                    <>
                      <Tag className="h-3 w-3 mr-1" />
                      Code Promo
                    </>
                  )}
                </Badge>
                {offer.date_fin && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Jusqu&apos;au {formatDate(offer.date_fin)}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{offer.titre}</h1>
              <p className="text-lg text-muted-foreground">{offer.description}</p>
            </div>

            {/* QR Code ou Code Promo */}
            {isQRCode && offer.qr_code_data ? (
              <QRCodeCard
                qrCodeData={offer.qr_code_data}
                partnerName={offer.partner.nom}
                onGenerate={handleQRGenerate}
              />
            ) : offer.code_promo ? (
              <PromoCodeCard
                codePromo={offer.code_promo}
                partnerName={offer.partner.nom}
                onCopy={handleCodeCopy}
              />
            ) : null}

            {/* Conditions */}
            {offer.conditions && (
              <Card>
                <Collapsible open={conditionsOpen} onOpenChange={setConditionsOpen}>
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="py-4 px-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Conditions d&apos;utilisation</h3>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            conditionsOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-6 pb-4">
                      <div className="text-sm text-muted-foreground whitespace-pre-line border-t pt-4">
                        {offer.conditions}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Période de validité */}
            {(offer.date_debut || offer.date_fin) && (
              <Card>
                <CardContent className="py-4 px-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Période de validité
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {offer.date_debut && `Du ${formatDate(offer.date_debut)}`}
                    {offer.date_debut && offer.date_fin && ' '}
                    {offer.date_fin && `jusqu'au ${formatDate(offer.date_fin)}`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Partner info */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <PartnerInfoCard partner={offer.partner} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
