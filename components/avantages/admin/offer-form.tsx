/**
 * Formulaire de création/édition d'une offre partenaire
 * Champs conditionnels selon le type (QR Code ou Code Promo)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/avantages/admin/image-upload';
import { PartnerOffer, OfferFormData, OfferType, Partner } from '@/lib/types/avantages.types';
import { createOfferAction, updateOfferAction } from '@/app/actions/offers';
import { toast } from 'sonner';
import { Loader2, QrCode, Tag } from 'lucide-react';

interface OfferFormProps {
  offer?: PartnerOffer;
  partners: Partner[];
  defaultPartnerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OfferForm({ offer, partners, defaultPartnerId, onSuccess, onCancel }: OfferFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [partnerId, setPartnerId] = useState(offer?.partner_id || defaultPartnerId || '');
  const [titre, setTitre] = useState(offer?.titre || '');
  const [description, setDescription] = useState(offer?.description || '');
  const [typeAvantage, setTypeAvantage] = useState<OfferType>(offer?.type_avantage || 'qr_code');
  const [reductionPourcentage, setReductionPourcentage] = useState<string>(
    offer?.reduction_pourcentage?.toString() || ''
  );
  const [reductionMontant, setReductionMontant] = useState<string>(
    offer?.reduction_montant?.toString() || ''
  );
  const [codePromo, setCodePromo] = useState(offer?.code_promo || '');
  const [qrCodeData, setQrCodeData] = useState(offer?.qr_code_data || '');
  const [imageUrl, setImageUrl] = useState(offer?.image_url || '');
  const [conditions, setConditions] = useState(offer?.conditions || '');
  const [dateDebut, setDateDebut] = useState(offer?.date_debut || '');
  const [dateFin, setDateFin] = useState(offer?.date_fin || '');
  const [actif, setActif] = useState(offer?.actif ?? true);
  const [ordreAffichage, setOrdreAffichage] = useState<string>(
    offer?.ordre_affichage?.toString() || '0'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!partnerId) {
        toast.error('Veuillez sélectionner un partenaire');
        setLoading(false);
        return;
      }

      if (!titre.trim()) {
        toast.error('Le titre est requis');
        setLoading(false);
        return;
      }

      if (typeAvantage === 'qr_code' && !qrCodeData.trim()) {
        toast.error('Les données du QR Code sont requises');
        setLoading(false);
        return;
      }

      if (typeAvantage === 'code_promo' && !codePromo.trim()) {
        toast.error('Le code promo est requis');
        setLoading(false);
        return;
      }

      // Préparer les données
      const formData: OfferFormData = {
        partner_id: partnerId,
        titre: titre.trim(),
        description: description.trim() || undefined,
        type_avantage: typeAvantage,
        reduction_pourcentage: reductionPourcentage ? parseInt(reductionPourcentage) : undefined,
        reduction_montant: reductionMontant ? parseFloat(reductionMontant) : undefined,
        code_promo: typeAvantage === 'code_promo' ? codePromo.trim() : undefined,
        qr_code_data: typeAvantage === 'qr_code' ? qrCodeData.trim() : undefined,
        image_url: imageUrl || undefined,
        conditions: conditions.trim() || undefined,
        date_debut: dateDebut || undefined,
        date_fin: dateFin || undefined,
        actif,
        ordre_affichage: ordreAffichage ? parseInt(ordreAffichage) : 0,
      };

      let result;
      if (offer) {
        // Mode édition
        result = await updateOfferAction(offer.id, formData);
      } else {
        // Mode création
        result = await createOfferAction(formData);
      }

      if (result.success) {
        toast.success(offer ? 'Offre mise à jour avec succès !' : 'Offre créée avec succès !');
        onSuccess?.();
        router.push('/dashboard/admin/avantages');
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card 1: Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Partenaire */}
          <div className="space-y-2">
            <Label htmlFor="partner">Partenaire *</Label>
            <Select value={partnerId} onValueChange={setPartnerId} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un partenaire" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre de l&apos;offre *</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: 20% de réduction sur l'addition"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'offre en détails..."
              rows={3}
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label>Image de l&apos;offre</Label>
            <ImageUpload
              bucketName="offer-images"
              currentImageUrl={imageUrl}
              onUploadComplete={setImageUrl}
              maxSizeMB={5}
              aspectRatio="video"
            />
            <p className="text-xs text-muted-foreground">
              Formats acceptés : JPEG, PNG, WebP. Max 5 MB.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Type d'avantage */}
      <Card>
        <CardHeader>
          <CardTitle>Type d&apos;avantage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type d&apos;avantage *</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTypeAvantage('qr_code')}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  typeAvantage === 'qr_code'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <QrCode className="h-5 w-5" />
                <span className="font-medium">QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeAvantage('code_promo')}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  typeAvantage === 'code_promo'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Tag className="h-5 w-5" />
                <span className="font-medium">Code Promo</span>
              </button>
            </div>
          </div>

          {/* Champs conditionnels selon le type */}
          {typeAvantage === 'qr_code' ? (
            <div className="space-y-2">
              <Label htmlFor="qrCodeData">Données du QR Code *</Label>
              <Input
                id="qrCodeData"
                value={qrCodeData}
                onChange={(e) => setQrCodeData(e.target.value)}
                placeholder="Ex: PARTNER-2024-OFFER"
                required
              />
              <p className="text-xs text-muted-foreground">
                Identifiant unique pour le QR code (sera encodé)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="codePromo">Code Promo *</Label>
              <Input
                id="codePromo"
                value={codePromo}
                onChange={(e) => setCodePromo(e.target.value.toUpperCase())}
                placeholder="Ex: SAPEURS2024"
                required
              />
              <p className="text-xs text-muted-foreground">
                Code à présenter lors de l&apos;achat
              </p>
            </div>
          )}

          {/* Réduction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reductionPourcentage">Réduction (%)</Label>
              <Input
                id="reductionPourcentage"
                type="number"
                min="0"
                max="100"
                value={reductionPourcentage}
                onChange={(e) => setReductionPourcentage(e.target.value)}
                placeholder="Ex: 20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reductionMontant">Réduction (€)</Label>
              <Input
                id="reductionMontant"
                type="number"
                min="0"
                step="0.01"
                value={reductionMontant}
                onChange={(e) => setReductionMontant(e.target.value)}
                placeholder="Ex: 10.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Conditions et validité */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions et validité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conditions */}
          <div className="space-y-2">
            <Label htmlFor="conditions">Conditions d&apos;utilisation</Label>
            <Textarea
              id="conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Ex: Valable du lundi au jeudi. Non cumulable avec d'autres offres..."
              rows={4}
            />
          </div>

          {/* Dates de validité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Paramètres */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actif */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="actif">Offre active</Label>
              <p className="text-sm text-muted-foreground">
                L&apos;offre est visible et utilisable par les utilisateurs
              </p>
            </div>
            <Switch id="actif" checked={actif} onCheckedChange={setActif} />
          </div>

          {/* Ordre d'affichage */}
          <div className="space-y-2">
            <Label htmlFor="ordreAffichage">Ordre d&apos;affichage</Label>
            <Input
              id="ordreAffichage"
              type="number"
              min="0"
              value={ordreAffichage}
              onChange={(e) => setOrdreAffichage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Les offres sont affichées par ordre croissant (0 = en premier)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {offer ? 'Mettre à jour' : 'Créer l\'offre'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
