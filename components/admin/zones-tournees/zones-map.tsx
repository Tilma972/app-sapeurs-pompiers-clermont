"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";

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
  geom: Feature<Geometry> | FeatureCollection<Geometry>;
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
  equipes: Equipe[];
}

export function ZonesMap({ zones, equipes }: ZonesMapProps) {
  // Convertir les zones en GeoJSON FeatureCollection
  const geoJsonData = useMemo<FeatureCollection<Geometry>>(() => {
    const features = zones.map((zone) => {
      // Le champ geom peut être soit une Feature soit une FeatureCollection
      let geometry: Geometry;

      if ('type' in zone.geom) {
        if (zone.geom.type === 'FeatureCollection') {
          // Si c'est une FeatureCollection, prendre la première feature
          const fc = zone.geom as FeatureCollection<Geometry>;
          geometry = fc.features[0]?.geometry || {
            type: 'Polygon',
            coordinates: []
          };
        } else if (zone.geom.type === 'Feature') {
          // Si c'est une Feature, extraire la geometry
          const f = zone.geom as Feature<Geometry>;
          geometry = f.geometry;
        } else {
          // C'est directement une Geometry
          geometry = zone.geom as Geometry;
        }
      } else {
        // Fallback
        geometry = {
          type: 'Polygon',
          coordinates: []
        };
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
    });

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
