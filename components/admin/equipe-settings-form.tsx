"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updateEquipeSettings } from "@/app/actions/admin";

// Using simple select via native element to avoid missing shadcn Select in this repo

interface EquipeSettingsFormProps {
  equipe: {
    id: string;
    nom: string;
    enable_retribution: boolean;
    pourcentage_minimum_pot: number;
    pourcentage_recommande_pot: number;
    mode_transparence: 'prive' | 'equipe' | 'anonyme';
  };
}

export function EquipeSettingsForm({ equipe }: EquipeSettingsFormProps) {
  const [settings, setSettings] = useState({
    enable_retribution: equipe.enable_retribution,
    pourcentage_minimum_pot: equipe.pourcentage_minimum_pot,
    pourcentage_recommande_pot: equipe.pourcentage_recommande_pot,
    mode_transparence: equipe.mode_transparence,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (settings.pourcentage_recommande_pot < settings.pourcentage_minimum_pot) {
      toast.error("La recommandation doit être ≥ au minimum");
      return;
    }

    setIsLoading(true);
    try {
      await updateEquipeSettings(equipe.id, settings);
      toast.success("Paramètres enregistrés !");
    } catch (error) {
      console.error(error);
      const msg = (error as Error)?.message || "Erreur lors de l\'enregistrement";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{equipe.nom}</CardTitle>
        <CardDescription>
          Configurez les règles de rétribution et de transparence
        </CardDescription>
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
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? "Enregistrement..." : "Enregistrer les paramètres"}
        </Button>
      </CardFooter>
    </Card>
  );
}
