"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// Using simple select via native element to avoid missing shadcn Select in this repo

interface EquipeSettingsFormProps {
  equipe: {
    id: string;
    nom: string;
    status?: 'active' | 'archived';
    enable_retribution: boolean;
    pourcentage_minimum_pot: number;
    pourcentage_recommande_pot: number;
    mode_transparence: 'prive' | 'equipe' | 'anonyme';
    communes?: string[] | null;
    secteur_centre_lat?: number | null;
    secteur_centre_lon?: number | null;
  };
  canEdit?: boolean;
  canArchive?: boolean;
}

export function EquipeSettingsForm({ equipe, canEdit = false, canArchive = false }: EquipeSettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState({
    enable_retribution: equipe.enable_retribution,
    pourcentage_minimum_pot: equipe.pourcentage_minimum_pot,
    pourcentage_recommande_pot: equipe.pourcentage_recommande_pot,
    mode_transparence: equipe.mode_transparence,
  });
  const [geo, setGeo] = useState({
    communesText: (equipe.communes && equipe.communes.length > 0) ? equipe.communes.join(', ') : '',
    secteur_centre_lat: equipe.secteur_centre_lat ?? undefined as number | undefined,
    secteur_centre_lon: equipe.secteur_centre_lon ?? undefined as number | undefined,
  })
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (settings.pourcentage_recommande_pot < settings.pourcentage_minimum_pot) {
      toast.error("La recommandation doit être ≥ au minimum");
      return;
    }

    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...settings,
        communes: geo.communesText
          ? geo.communesText.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
        secteur_centre_lat: geo.secteur_centre_lat ?? null,
        secteur_centre_lon: geo.secteur_centre_lon ?? null,
      }

      const res = await fetch(`/api/admin/equipes/${equipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }))
        const msg = (data?.error as string) || `Erreur ${res.status}`
        throw new Error(msg)
      }
      router.refresh();
      toast.success("Paramètres enregistrés !");
    } catch (error) {
      console.error(error);
      const msg = (error as Error)?.message || "Erreur lors de l\'enregistrement";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm(`Archiver l'équipe « ${equipe.nom} » ?`)) return;
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/equipes/${equipe.id}/archive`, { method: 'PATCH' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }))
        const msg = (data?.error as string) || `Erreur ${res.status}`
        throw new Error(msg)
      }
      toast.success('Équipe archivée');
      router.refresh();
    } catch (e) {
      console.error(e)
      toast.error((e as Error).message || 'Erreur lors de l\'archivage')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{equipe.nom}</CardTitle>
            <CardDescription>
              Configurez les règles de rétribution, transparence et zone
            </CardDescription>
          </div>
          <Badge variant={equipe.status === 'archived' ? 'destructive' : 'secondary'}>
            {equipe.status === 'archived' ? 'Archivée' : 'Active'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activation rétribution */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Rétribution activée</Label>
            <div className="text-sm text-muted-foreground">
              Activer le système 70/30 pour cette équipe
            </div>
          </div>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={settings.enable_retribution}
            disabled={!canEdit || isLoading || equipe.status === 'archived'}
            onChange={(e) =>
              setSettings({ ...settings, enable_retribution: e.target.checked })
            }
          />
        </div>

        {settings.enable_retribution && (
          <>
            {/* Minimum obligatoire */}
            <div className="space-y-2">
              <Label htmlFor="minimum">Pourcentage minimum obligatoire</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="minimum"
                  type="number"
                  min={0}
                  max={100}
                  value={settings.pourcentage_minimum_pot}
                  disabled={!canEdit || isLoading || equipe.status === 'archived'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pourcentage_minimum_pot: Number(e.target.value),
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Chaque pompier doit mettre au minimum ce pourcentage dans le pot d&apos;équipe
              </p>
            </div>

            {/* Recommandation */}
            <div className="space-y-2">
              <Label htmlFor="recommande">Pourcentage recommandé</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="recommande"
                  type="number"
                  min={settings.pourcentage_minimum_pot}
                  max={100}
                  value={settings.pourcentage_recommande_pot}
                  disabled={!canEdit || isLoading || equipe.status === 'archived'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pourcentage_recommande_pot: Number(e.target.value),
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Valeur suggérée par défaut (doit être ≥ minimum)
              </p>
            </div>

            {/* Mode de transparence */}
            <div className="space-y-2">
              <Label htmlFor="transparence">Mode de transparence</Label>
              <select
                id="transparence"
                className="w-full border rounded h-10 px-3 bg-background"
                value={settings.mode_transparence}
                disabled={!canEdit || isLoading || equipe.status === 'archived'}
                onChange={(e) =>
                  setSettings({ ...settings, mode_transparence: e.target.value as 'prive' | 'equipe' | 'anonyme' })
                }
              >
                <option value="prive">🔒 Privé - Chacun voit uniquement sa contribution</option>
                <option value="equipe">👥 Équipe - Tous voient les contributions (recommandé)</option>
                <option value="anonyme">📊 Anonyme - Seulement la moyenne visible</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Définit qui peut voir les contributions au pot d&apos;équipe
              </p>
            </div>
          </>
        )}

        {/* Zone géographique */}
        <div className="space-y-2">
          <Label htmlFor="communes">Communes desservies (séparées par des virgules)</Label>
          <textarea
            id="communes"
            className="w-full border rounded min-h-20 p-2 bg-background"
            placeholder="Clermont-l'Hérault, Canet, Aspiran, ..."
            value={geo.communesText}
            disabled={!canEdit || isLoading || equipe.status === 'archived'}
            onChange={(e) => setGeo({ ...geo, communesText: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Utilisé pour la carte et le périmètre d&apos;intervention</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude centre de secteur</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              value={geo.secteur_centre_lat ?? ''}
              disabled={!canEdit || isLoading || equipe.status === 'archived'}
              onChange={(e) => setGeo({ ...geo, secteur_centre_lat: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lon">Longitude centre de secteur</Label>
            <Input
              id="lon"
              type="number"
              step="any"
              value={geo.secteur_centre_lon ?? ''}
              disabled={!canEdit || isLoading || equipe.status === 'archived'}
              onChange={(e) => setGeo({ ...geo, secteur_centre_lon: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSave} disabled={!canEdit || isLoading || equipe.status === 'archived'} className="w-full sm:w-auto">
          {isLoading ? "Enregistrement..." : "Enregistrer les paramètres"}
        </Button>
        {canArchive && equipe.status !== 'archived' && (
          <Button variant="destructive" onClick={handleArchive} disabled={isLoading} className="w-full sm:w-auto">
            Archiver l&apos;équipe
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
