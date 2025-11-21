"use client";

import { useEffect, useRef, useState } from "react";
import L, { type Layer, type LeafletMouseEvent } from "leaflet";
import type { Feature, Geometry } from "geojson";
import "leaflet/dist/leaflet.css";

interface Zone {
  id: string;
  code_zone: string;
  nom_zone: string;
  population_estimee: number | null;
  nb_calendriers_alloues: number | null;
  nb_calendriers_distribues: number | null;
  statut: string;
  equipe_nom: string | null;
  equipe_secteur: string | null;
  equipe_couleur: string | null;
  pompier_id: string | null;
  pompier_nom: string | null;
  geom: Geometry;
}

interface UserZone {
  id: string;
  code_zone: string;
  nom_zone: string;
  population_estimee: number | null;
  nb_calendriers_alloues: number | null;
  nb_calendriers_distribues: number | null;
  statut: string;
  geom: Geometry;
}

interface ZonesMapUserViewProps {
  zones: Zone[];
  userZone: UserZone | null;
  equipeColor: string;
}

export function ZonesMapUserView({
  zones,
  userZone,
  equipeColor,
}: ZonesMapUserViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  // ✅ IMPORTANT : On utilise FeatureGroup au lieu de LayerGroup car il possède la méthode .getBounds()
  const layersGroup = useRef<L.FeatureGroup | null>(null); 
  
  const isMapInitialized = useRef(false);
  const prevUserZoneId = useRef<string | null>(null);
  
  const [showLegend, setShowLegend] = useState(true);

  // 1. Initialisation de la carte
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      center: [43.6275, 3.4331],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // ✅ Utilisation de featureGroup() qui supporte getBounds() nativement
    layersGroup.current = L.featureGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        layersGroup.current = null;
      }
    };
  }, []);

  // 2. Mise à jour des données
  useEffect(() => {
    if (!mapInstance.current || !layersGroup.current) return;

    const map = mapInstance.current;
    const layers = layersGroup.current;

    layers.clearLayers();

    // --- Définitions des styles et popups (inchangées) ---
    const getZoneStyle = (zone: Zone): L.PathOptions => {
      const isUserZone = userZone?.id === zone.id;

      if (isUserZone) {
        return {
          color: equipeColor,
          weight: 4,
          opacity: 1,
          fillColor: equipeColor,
          fillOpacity: 0.5,
        };
      } else if (zone.pompier_id) {
        return {
          color: zone.equipe_couleur || "#94a3b8",
          weight: 2,
          opacity: 0.8,
          fillColor: zone.equipe_couleur || "#94a3b8",
          fillOpacity: 0.2,
        };
      } else {
        return {
          color: "#64748b",
          weight: 1,
          opacity: 0.6,
          fillColor: "#94a3b8",
          fillOpacity: 0.1,
        };
      }
    };

    const createPopup = (zone: Zone): string => {
      const isUserZone = userZone?.id === zone.id;
      const progression = zone.nb_calendriers_alloues
        ? Math.round(
            ((zone.nb_calendriers_distribues || 0) /
              zone.nb_calendriers_alloues) *
              100
          )
        : 0;

      return `
        <div class="p-2 min-w-[200px]">
          ${
            isUserZone
              ? '<div class="mb-2 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold text-center">🎯 TA ZONE</div>'
              : ""
          }
          <div class="font-bold text-base mb-2">${zone.code_zone}</div>
          <div class="text-sm mb-3">${zone.nom_zone}</div>
          
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Population :</span>
              <span class="font-medium">${zone.population_estimee?.toLocaleString() || "N/A"}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Calendriers :</span>
              <span class="font-medium">${zone.nb_calendriers_distribues || 0} / ${zone.nb_calendriers_alloues || 0}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Progression :</span>
              <span class="font-medium">${progression}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Statut :</span>
              <span class="font-medium">${zone.statut}</span>
            </div>
            ${
              zone.pompier_nom
                ? `<div class="flex justify-between pt-2 border-t">
                    <span class="text-muted-foreground">Pompier :</span>
                    <span class="font-medium">${zone.pompier_nom}</span>
                   </div>`
                : '<div class="pt-2 border-t text-muted-foreground italic">Non assignée</div>'
            }
          </div>
        </div>
      `;
    };

    const onEachFeature = (feature: Feature<Geometry>, layer: Layer) => {
      const zone = feature.properties as Zone;
      layer.bindPopup(createPopup(zone), { maxWidth: 300, className: "custom-popup" });

      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          const targetLayer = e.target as L.Path;
          const isUserZone = userZone?.id === zone.id;
          targetLayer.setStyle({
            weight: isUserZone ? 5 : 3,
            fillOpacity: isUserZone ? 0.7 : 0.4,
          });
        },
        mouseout: (e: LeafletMouseEvent) => {
          const targetLayer = e.target as L.Path;
          targetLayer.setStyle(getZoneStyle(zone));
        },
      });
    };

    // --- Ajout des couches ---
    // Note : Plus besoin de 'allBounds' manuel car FeatureGroup gère ça pour nous

    zones.forEach((zone) => {
      try {
        const feature: Feature<Geometry, Zone> = {
          type: "Feature",
          geometry: zone.geom,
          properties: zone,
        };

        L.geoJSON(feature, {
          style: getZoneStyle(zone),
          onEachFeature,
        }).addTo(layers); // Ajout au FeatureGroup
      } catch (error) {
        console.error("Error adding zone:", zone.code_zone, error);
      }
    });

    // --- Logique de recentrage intelligente ---
    const userZoneChanged = prevUserZoneId.current !== userZone?.id;
    // On vérifie si le groupe a des layers via getLayers().length
    const hasLayers = layers.getLayers().length > 0;
    const shouldFitBounds = (!isMapInitialized.current || userZoneChanged) && hasLayers;

    if (shouldFitBounds) {
      if (userZone && zones.find((z) => z.id === userZone.id)) {
        // Cas A : Focus sur zone pompier
        const userZoneData = zones.find((z) => z.id === userZone.id);
        if (userZoneData) {
          try {
            const feature: Feature<Geometry, Zone> = {
              type: "Feature",
              geometry: userZoneData.geom,
              properties: userZoneData,
            };
            const userGeoJson = L.geoJSON(feature);
            map.fitBounds(userGeoJson.getBounds(), { padding: [50, 50] });
          } catch {
            // Fallback : utiliser les bounds globales du groupe
            // ✅ CORRECTION : layers.getBounds() marche directement avec L.FeatureGroup
            const bounds = layers.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
          }
        }
      } else {
        // Cas B : Vue d'ensemble
        // ✅ CORRECTION : Plus besoin de L.latLngBounds(allBounds)
        const bounds = layers.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
      }

      isMapInitialized.current = true;
      prevUserZoneId.current = userZone?.id || null;
    }

  }, [zones, userZone, equipeColor]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      {/* Légende et reste du JSX inchangés */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 bg-card border rounded-lg shadow-lg p-3 text-xs z-[1000]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Légende</span>
            <button onClick={() => setShowLegend(false)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ backgroundColor: equipeColor, borderColor: equipeColor, opacity: 0.7 }} />
              <span>Ta zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border" style={{ backgroundColor: equipeColor, borderColor: equipeColor, opacity: 0.3 }} />
              <span>Zone de collègue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-slate-500 bg-slate-300 opacity-30" />
              <span>Non assignée</span>
            </div>
          </div>
        </div>
      )}

      {!showLegend && (
        <button onClick={() => setShowLegend(true)} className="absolute bottom-4 right-4 bg-card border rounded-lg shadow-lg p-2 text-xs z-[1000] hover:bg-accent">
          📖 Légende
        </button>
      )}

      {zones.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1000]">
          <div className="bg-card border rounded-lg shadow-lg p-6 text-center">
            <p className="text-muted-foreground">Aucune zone de tournée disponible pour ce secteur</p>
          </div>
        </div>
      )}
    </div>
  );
}
