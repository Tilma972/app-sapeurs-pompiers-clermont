"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { extractGeometry } from "@/lib/geojson-utils";

// Import dynamique pour éviter les erreurs SSR avec Leaflet
const MapInner = dynamic(() => import("./zones-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-muted rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Chargement de la carte...</p>
    </div>
  ),
});

interface Zone {
  id: string;
  code_zone: string;
  nom_zone: string;
  geom: unknown; // ✅ Accepte Feature, Geometry, FeatureCollection ou string JSON
  population_estimee: number | null;
  nb_calendriers_alloues: number | null;
  nb_calendriers_distribues: number | null;
  statut: string;
  equipe_nom: string | null;
  equipe_couleur: string | null;
  pompier_nom: string | null;
  progression_pct: number | null;
}

interface Equipe {
  id: string;
  nom: string;
  secteur: string;
  couleur: string;
  numero: number | null;
}

interface ZonesMapProps {
  zones: Zone[];
  equipes?: Equipe[]; // Not used currently but kept for future features
}

export function ZonesMap({ zones }: ZonesMapProps) {
  // Convertir les zones en GeoJSON FeatureCollection
  const geoJsonData = useMemo<FeatureCollection<Geometry>>(() => {
    const features = zones
      .map((zone) => {
        // ✅ Extraire la géométrie avec le helper (gère Feature/Geometry/string)
        const geometry = extractGeometry(zone.geom);

        if (!geometry) {
          console.warn("Skipping zone with invalid geom:", zone.code_zone);
          return null;
        }

        const feature: Feature<Geometry> = {
          type: 'Feature',
          geometry,
          properties: {
            id: zone.id,
            code_zone: zone.code_zone,
            nom_zone: zone.nom_zone,
            population_estimee: zone.population_estimee,
            nb_calendriers_alloues: zone.nb_calendriers_alloues,
            nb_calendriers_distribues: zone.nb_calendriers_distribues,
            statut: zone.statut,
            equipe_nom: zone.equipe_nom,
            equipe_couleur: zone.equipe_couleur,
            pompier_nom: zone.pompier_nom,
            progression_pct: zone.progression_pct,
          },
        };

        return feature;
      })
      .filter((f): f is Feature<Geometry> => f !== null); // ✅ Filtrer les zones invalides

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [zones]);

  if (zones.length === 0) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Aucune zone à afficher</p>
          <p className="text-sm text-muted-foreground">
            Les zones de tournée apparaîtront ici une fois importées
          </p>
        </div>
      </div>
    );
  }

  return <MapInner data={geoJsonData} />;
}
