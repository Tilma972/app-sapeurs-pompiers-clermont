'use client';

/**
 * SectorMapFullscreen - Carte plein écran pour visualiser le secteur
 * Version sans Card wrapper, optimisée pour occuper tout l'espace disponible
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SectorMapFullscreenProps {
  secteur: string;
}

function SectorMapFullscreen({ secteur }: SectorMapFullscreenProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Créer la carte centrée sur Clermont-l'Hérault
    const map = L.map(mapContainer.current, {
      center: [43.6275, 3.4331],
      zoom: 12,
      zoomControl: true,
    });

    // Tuiles OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapInstance.current = map;

    // Charger le GeoJSON du secteur
    fetch(`/sectors/${secteur}.geojson`)
      .then((res) => res.json())
      .then((geojson) => {
        const geoJsonLayer = L.geoJSON(geojson, {
          style: {
            color: "#C42D2D",
            weight: 3,
            opacity: 0.8,
            fillColor: "#C42D2D",
            fillOpacity: 0.2,
          },
        }).addTo(map);

        // Ajuster la vue pour afficher tout le secteur
        map.fitBounds(geoJsonLayer.getBounds(), {
          padding: [20, 20],
        });
      })
      .catch((err) => {
        console.error("Erreur chargement GeoJSON:", err);
      });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [secteur]);

  return (
    <div
      ref={mapContainer}
      className="h-full w-full"
    />
  );
}

export default SectorMapFullscreen;
