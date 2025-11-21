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
  geom: Geometry; // ✅ Typage fort au lieu de unknown
}

interface UserZone {
  id: string;
  code_zone: string;
  nom_zone: string;
  population_estimee: number | null;
  nb_calendriers_alloues: number | null;
  nb_calendriers_distribues: number | null;
  statut: string;
  geom: Geometry; // ✅ Typage fort au lieu de unknown
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
  const layersGroup = useRef<L.LayerGroup | null>(null);
  const isMapInitialized = useRef(false); // ✅ Évite recentrage forcé à chaque update
  const prevUserZoneId = useRef<string | null>(null); // ✅ Détecte changement d'assignation
  const [showLegend, setShowLegend] = useState(true);

  // ✅ Effect pour initialiser la carte (une seule fois)
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Créer la carte
    const map = L.map(mapContainer.current, {
      center: [43.6275, 3.4331],
      zoom: 12,
      zoomControl: true,
    });

    // Tuiles OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Créer le groupe de layers
    layersGroup.current = L.layerGroup().addTo(map);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        layersGroup.current = null;
      }
    };
  }, []);

  // ✅ Effect séparé pour mettre à jour les zones (réactif aux changements)
  useEffect(() => {
    if (!mapInstance.current || !layersGroup.current) return;

    const map = mapInstance.current;
    const layers = layersGroup.current;

    // Nettoyer les anciens layers
    layers.clearLayers();

    // Fonction pour obtenir le style d'une zone
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

    // Fonction pour créer le popup
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
                ? `
              <div class="flex justify-between pt-2 border-t">
                <span class="text-muted-foreground">Pompier :</span>
                <span class="font-medium">${zone.pompier_nom}</span>
              </div>
            `
                : '<div class="pt-2 border-t text-muted-foreground italic">Non assignée</div>'
            }
          </div>
        </div>
      `;
    };

    // Fonction pour gérer les événements de survol
    const onEachFeature = (feature: Feature<Geometry>, layer: Layer) => {
      const zone = feature.properties as Zone;

      layer.bindPopup(createPopup(zone), {
        maxWidth: 300,
        className: "custom-popup",
      });

      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          const targetLayer = e.target as L.Path; // ✅ Cast explicite
          const isUserZone = userZone?.id === zone.id;

          targetLayer.setStyle({
            weight: isUserZone ? 5 : 3,
            fillOpacity: isUserZone ? 0.7 : 0.4,
          });
        },
        mouseout: (e: LeafletMouseEvent) => {
          const targetLayer = e.target as L.Path; // ✅ Cast explicite
          targetLayer.setStyle(getZoneStyle(zone));
        },
      });
    };

    // Ajouter toutes les zones sur la carte
    const allBounds: L.LatLngBounds[] = [];

    zones.forEach((zone) => {
      try {
        const feature: Feature<Geometry> = {
          type: "Feature",
          geometry: zone.geom,
          properties: zone as any, // ✅ Plus propre que 'as unknown as Record'
        };

        const geoJsonLayer = L.geoJSON(feature, {
          style: getZoneStyle(zone),
          onEachFeature,
        });

        geoJsonLayer.addTo(layers);
        allBounds.push(geoJsonLayer.getBounds());
      } catch (error) {
        console.error("Error adding zone:", zone.code_zone, error);
      }
    });

    // ✅ Recentrer intelligemment : uniquement si premier rendu OU userZone vient de changer
    const userZoneChanged = prevUserZoneId.current !== userZone?.id;
    const shouldFitBounds =
      (!isMapInitialized.current || userZoneChanged) && allBounds.length > 0;

    if (shouldFitBounds) {
      if (userZone && zones.find((z) => z.id === userZone.id)) {
        // Centrer sur la zone du pompier
        const userZoneData = zones.find((z) => z.id === userZone.id);
        if (userZoneData) {
          try {
            const feature: Feature<Geometry> = {
              type: "Feature",
              geometry: userZoneData.geom,
              properties: userZoneData as any,
            };
            const userGeoJson = L.geoJSON(feature);
            map.fitBounds(userGeoJson.getBounds(), { padding: [50, 50] });
          } catch {
            // Fallback : centrer sur toutes les zones
            const bounds = L.latLngBounds(allBounds);
            if (bounds.isValid()) { // ✅ Sécurité supplémentaire
              map.fitBounds(bounds, { padding: [20, 20] });
            }
          }
        }
      } else {
        // Centrer sur toutes les zones
        const bounds = L.latLngBounds(allBounds);
        if (bounds.isValid()) { // ✅ Sécurité supplémentaire
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      }

      // Marquer comme initialisé et sauvegarder l'ID de la zone
      isMapInitialized.current = true;
      prevUserZoneId.current = userZone?.id || null;
    }
  }, [zones, userZone, equipeColor]); // ✅ Réactif aux changements

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Légende */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 bg-card border rounded-lg shadow-lg p-3 text-xs z-[1000]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Légende</span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border-2"
                style={{
                  backgroundColor: equipeColor,
                  borderColor: equipeColor,
                  opacity: 0.7,
                }}
              />
              <span>Ta zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border"
                style={{
                  backgroundColor: equipeColor,
                  borderColor: equipeColor,
                  opacity: 0.3,
                }}
              />
              <span>Zone de collègue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-slate-500 bg-slate-300 opacity-30" />
              <span>Non assignée</span>
            </div>
          </div>
        </div>
      )}

      {/* Bouton pour réafficher la légende */}
      {!showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className="absolute bottom-4 right-4 bg-card border rounded-lg shadow-lg p-2 text-xs z-[1000] hover:bg-accent"
        >
          📖 Légende
        </button>
      )}

      {/* Message si pas de zones */}
      {zones.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1000]">
          <div className="bg-card border rounded-lg shadow-lg p-6 text-center">
            <p className="text-muted-foreground">
              Aucune zone de tournée disponible pour ce secteur
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
