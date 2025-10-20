"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updateRetributionPreference } from "@/app/actions/retribution";

interface RetributionPreferencesCardProps {
  currentPreference: number | null;
  minimumEquipe: number;
  recommandationEquipe: number;
}

export function RetributionPreferencesCard({
  currentPreference,
  minimumEquipe,
  recommandationEquipe,
}: RetributionPreferencesCardProps) {
  const [preference, setPreference] = useState<number>(
    currentPreference ?? recommandationEquipe
  );
  const [isLoading, setIsLoading] = useState(false);

  const versPot = preference;
  const versPerso = 100 - preference;

  const handleSave = async () => {
    if (preference < minimumEquipe) {
      toast.error(`Le minimum imposé par votre équipe est de ${minimumEquipe}%`);
      return;
    }

    setIsLoading(true);
    try {
      await updateRetributionPreference(preference);
      toast.success("Préférence enregistrée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚙️ Modifier ma répartition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Part au pot d&apos;équipe</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={minimumEquipe}
                  max={100}
                  value={preference}
                  onChange={(e) => setPreference(Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <input
              type="range"
              min={minimumEquipe}
              max={100}
              step={5}
              value={preference}
              onChange={(e) => setPreference(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">Min: {minimumEquipe}% • Recommandation: {recommandationEquipe}%</div>
          </div>
          <div className="bg-muted/50 p-3 rounded text-sm flex items-center justify-between">
            <span>Aperçu : 30€ → {((30 * versPot) / 100).toFixed(2)}€ pot + {((30 * versPerso) / 100).toFixed(2)}€ perso</span>
          </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSave}
          disabled={isLoading || preference < minimumEquipe}
          className="w-full"
        >
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </CardFooter>
    </Card>
  );
}
