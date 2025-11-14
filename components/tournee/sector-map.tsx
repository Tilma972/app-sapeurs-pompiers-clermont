"use client";

/**
 * SectorMap - Affiche une carte interactive du secteur assigné
 * Utilise Leaflet + GeoJSON pour afficher les limites du secteur
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface SectorMapProps {
  secteur: string; // 'nord', 'sud', 'est', 'ouest', 'centre', 'nord-est', 'sud-est'
  className?: string;
  fullscreen?: boolean; // Mode plein écran pour la modal
}

export function SectorMap({ secteur, className, fullscreen = false }: SectorMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    // Éviter la double initialisation
    if (!mapContainer.current || mapInstance.current) return;

    // Créer la carte centrée sur Clermont-l'Hérault
    const map = L.map(mapContainer.current, {
      center: [43.6275, 3.4331], // Clermont-l'Hérault
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false, // Éviter le scroll accidentel
      dragging: true,
      touchZoom: true,
    });

    mapInstance.current = map;

    // Ajouter le fond de carte OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Charger le GeoJSON du secteur
    const loadSectorGeoJSON = async () => {
      try {
        const response = await fetch(`/sectors/${secteur}.geojson`);
        if (!response.ok) {
          console.error(`Secteur ${secteur} non trouvé`);
          return;
        }

        const geojson = await response.json();

        // Ajouter le GeoJSON à la carte avec un style
        const geoJsonLayer = L.geoJSON(geojson, {
          style: {
            color: "#C42D2D", // Rouge pompier
            weight: 3,
            opacity: 0.8,
            fillColor: "#C42D2D",
            fillOpacity: 0.15,
          },
          onEachFeature: (feature, layer) => {
            // Ajouter un popup avec le nom de la commune si disponible
            if (feature.properties?.name) {
              layer.bindPopup(`<b>${feature.properties.name}</b>`);
            }
          },
        }).addTo(map);

        // Ajuster la vue pour afficher tout le secteur
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error("Erreur chargement GeoJSON:", error);
      }
    };

    loadSectorGeoJSON();

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [secteur]);

  // Si mode fullscreen, pas de Card wrapper
  if (fullscreen) {
    return (
      <div
        ref={mapContainer}
        className={`rounded-lg overflow-hidden border border-border ${className}`}
      />
    );
  }

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Votre secteur</h3>
        </div>
        <div
          ref={mapContainer}
          className="h-[300px] rounded-lg overflow-hidden border border-border"
        />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Secteur <span className="font-medium capitalize">{secteur}</span>
        </p>
      </div>
    </Card>
  );
}
