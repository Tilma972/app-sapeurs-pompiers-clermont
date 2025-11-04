/**
 * Formulaire de création/édition d'un partenaire
 * Avec validation et upload d'image
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
import { ImageUpload } from './image-upload';
import { Partner, PartnerCategory, PartnerFormData } from '@/lib/types/avantages.types';
import { createPartnerAction, updatePartnerAction } from '@/app/actions/partners';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerFormProps {
  partner?: Partner; // Si fourni, mode édition
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES: { value: PartnerCategory; label: string }[] = [
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'commerce', label: '🛍️ Commerce' },
  { value: 'service', label: '🔧 Service' },
  { value: 'loisir', label: '🎭 Loisir' },
  { value: 'sante', label: '⚕️ Santé' },
  { value: 'autre', label: '📦 Autre' },
];

export function PartnerForm({ partner, onSuccess, onCancel }: PartnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PartnerFormData>({
    nom: partner?.nom || '',
    description: partner?.description || '',
    categorie: partner?.categorie || 'commerce',
    logo_url: partner?.logo_url || undefined,
    adresse: partner?.adresse || undefined,
    code_postal: partner?.code_postal || undefined,
    ville: partner?.ville || undefined,
    telephone: partner?.telephone || undefined,
    email: partner?.email || undefined,
    site_web: partner?.site_web || undefined,
    horaires: partner?.horaires || undefined,
    actif: partner?.actif ?? true,
    featured: partner?.featured ?? false,
    ordre_affichage: partner?.ordre_affichage ?? 100,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (formData.telephone && !/^[\d\s\+\(\)-]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Téléphone invalide';
    }

    if (formData.site_web && !/^https?:\/\/.+/.test(formData.site_web)) {
      newErrors.site_web = 'URL invalide (doit commencer par http:// ou https://)';
    }

    if (formData.code_postal && !/^\d{5}$/.test(formData.code_postal)) {
      newErrors.code_postal = 'Code postal invalide (5 chiffres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (partner) {
        // Mode édition
        result = await updatePartnerAction(partner.id, formData);
      } else {
        // Mode création
        result = await createPartnerAction(formData);
      }

      if (result.success) {
        toast.success(partner ? 'Partenaire mis à jour avec succès !' : 'Partenaire créé avec succès !');
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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nom */}
          <div>
            <Label htmlFor="nom">
              Nom du partenaire <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Restaurant La Forge"
              className={errors.nom ? 'border-destructive' : ''}
            />
            {errors.nom && <p className="text-sm text-destructive mt-1">{errors.nom}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Restaurant traditionnel au cœur de Clermont-l'Hérault..."
              rows={4}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description}</p>
            )}
          </div>

          {/* Catégorie */}
          <div>
            <Label htmlFor="categorie">
              Catégorie <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.categorie}
              onValueChange={(value) =>
                setFormData({ ...formData, categorie: value as PartnerCategory })
              }
            >
              <SelectTrigger id="categorie">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logo */}
          <div>
            <Label>Logo</Label>
            <ImageUpload
              bucketName="partner-logos"
              currentImageUrl={formData.logo_url}
              onUploadComplete={(url) => setFormData({ ...formData, logo_url: url })}
              onRemove={() => setFormData({ ...formData, logo_url: undefined })}
              aspectRatio="aspect-square"
            />
          </div>
        </CardContent>
      </Card>

      {/* Adresse et contact */}
      <Card>
        <CardHeader>
          <CardTitle>Adresse et contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse || ''}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="12 Place de la République"
              />
            </div>

            <div>
              <Label htmlFor="code_postal">Code postal</Label>
              <Input
                id="code_postal"
                value={formData.code_postal || ''}
                onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                placeholder="34800"
                maxLength={5}
                className={errors.code_postal ? 'border-destructive' : ''}
              />
              {errors.code_postal && (
                <p className="text-sm text-destructive mt-1">{errors.code_postal}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                value={formData.ville || ''}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                placeholder="Clermont-l'Hérault"
              />
            </div>

            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                value={formData.telephone || ''}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="04 67 96 00 00"
                className={errors.telephone ? 'border-destructive' : ''}
              />
              {errors.telephone && (
                <p className="text-sm text-destructive mt-1">{errors.telephone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@laforge.fr"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="site_web">Site web</Label>
              <Input
                id="site_web"
                type="url"
                value={formData.site_web || ''}
                onChange={(e) => setFormData({ ...formData, site_web: e.target.value })}
                placeholder="https://laforge.fr"
                className={errors.site_web ? 'border-destructive' : ''}
              />
              {errors.site_web && (
                <p className="text-sm text-destructive mt-1">{errors.site_web}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="horaires">Horaires</Label>
              <Textarea
                id="horaires"
                value={formData.horaires || ''}
                onChange={(e) => setFormData({ ...formData, horaires: e.target.value })}
                placeholder="Mar-Dim 12h-14h, 19h-22h&#10;Fermé le lundi"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Appuyez sur Entrée pour créer des sauts de ligne
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="actif" className="text-base">Partenaire actif</Label>
              <p className="text-sm text-muted-foreground">
                Visible sur la page Avantages
              </p>
            </div>
            <Switch
              id="actif"
              checked={formData.actif}
              onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="featured" className="text-base">Partenaire mis en avant</Label>
              <p className="text-sm text-muted-foreground">
                Affiché dans le carousel
              </p>
            </div>
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            />
          </div>

          <div>
            <Label htmlFor="ordre_affichage">Ordre d&apos;affichage</Label>
            <Input
              id="ordre_affichage"
              type="number"
              value={formData.ordre_affichage}
              onChange={(e) =>
                setFormData({ ...formData, ordre_affichage: parseInt(e.target.value) || 100 })
              }
              min={1}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Plus le nombre est petit, plus le partenaire apparaît en haut
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading} className="min-w-32">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {partner ? 'Mettre à jour' : 'Créer'}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>
    </form>
  );
}
