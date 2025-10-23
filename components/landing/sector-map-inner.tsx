"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSON as LGeoJSON, PathOptions, Layer, Path, StyleFunction, LatLngBounds, FitBoundsOptions } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const GEOJSON_URL =
  "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/21_communes/communes_secteur.json?v=20251022";

// Réglages faciles à ajuster pour l'init
const MAX_INITIAL_ZOOM = 9;
const INITIAL_ZOOM_BUMP = 0.25; // Était 1; mettez 0.25/0.75/1 selon le ressenti

export default function SectorMapInner() {
  const [data, setData] = useState<FeatureCollection<Geometry, Record<string, unknown>> | null>(null);
  const geoRef = useRef<LGeoJSON | null>(null);
  
  // Palette daltonisme-safe (Okabe–Ito) étendue en boucle jusqu'à 21 éléments
  const communeColors = useMemo(() => {
    const base = [
      "#E69F00", // orange
      "#56B4E9", // sky blue
      "#009E73", // bluish green
      "#F0E442", // yellow
      "#0072B2", // blue
      "#D55E00", // vermillion
      "#CC79A7", // reddish purple
      "#000000", // black
    ];
    const out: string[] = [];
    for (let i = 0; i < 21; i++) out.push(base[i % base.length]);
    return out;
  }, []);
  
  function FitBoundsOnData({ dep }: { dep: unknown }) {
    const map = useMap();
    useEffect(() => {
      const geo = geoRef.current;
      if (!geo) return;
      try {
        const bounds = geo.getBounds();
        requestAnimationFrame(() => {
          map.invalidateSize();
          // 1) Zoom qui tient dans l'écran
          const base = map.getBoundsZoom(bounds, true);
          // 2) Un petit cran en plus pour la lisibilité
          const target = Math.min(MAX_INITIAL_ZOOM, base + INITIAL_ZOOM_BUMP);
          map.setView(bounds.getCenter(), target, { animate: false });
        });
      } catch {}
    }, [dep, map]);
    return null;
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(GEOJSON_URL, { signal: controller.signal, cache: "force-cache" })
      .then((r) => r.json())
      .then((json: FeatureCollection<Geometry, Record<string, unknown>>) => {
        // Ajoute un index de couleur pour chaque feature
        if (Array.isArray(json.features)) {
          json.features.forEach((f, idx) => {
            const props = (f.properties ||= {});
            if (props && typeof props === "object") {
              (props as Record<string, unknown>).colorIndex = idx;
            }
          });
        }
        setData(json);
      })
      .catch(() => {
        // Silencieux: on garde la section sans carte en cas d'erreur réseau
      });
    return () => controller.abort();
  }, []);

  // Styles par défaut gérés via la fonction style et resetStyle; pas de constante locale nécessaire.

  // Style par feature en fonction de l'index (couleur différente par commune)
  const style = useMemo<StyleFunction>(
    () => (feature) => {
      const idx = (feature?.properties as Record<string, unknown> | undefined)?.colorIndex as number | undefined;
      const color = communeColors[(idx ?? 0) % communeColors.length];
      const s: PathOptions = {
        color: "#333", // contour sombre pour le contraste
        weight: 2,
        fillColor: color,
        fillOpacity: 0.3,
        className: "cursor-pointer",
      };
      return s;
    },
    [communeColors]
  );

  function getCommuneName(feature: Feature<Geometry, Record<string, unknown>>): string {
    const props = (feature.properties || {}) as Record<string, unknown>;
    const candidates = [
      "nom",
      "NOM",
      "name",
      "NAME",
      "commune",
      "COMMUNE",
      "libelle",
      "LIBELLE",
    ];
    for (const key of candidates) {
      const v = props[key];
      if (typeof v === "string" && v.trim()) return v;
    }
    return "Commune";
  }

  type TooltipCapable = { bindTooltip?: (content: string, options?: unknown) => void };
  type PopupCapable = { bindPopup?: (content: string | HTMLElement, options?: unknown) => void; openPopup?: () => void };

  const onEachFeature = (
    feature: Feature<Geometry, Record<string, unknown>>,
    layer: Layer
  ) => {
    // Tooltip avec le nom de commune (collant au curseur)
    const name = getCommuneName(feature);
  const tl = layer as unknown as TooltipCapable;
    tl.bindTooltip?.(name, { sticky: true, direction: "top" });
  // Popup pour mobile: lisibilité supérieure
  (layer as unknown as PopupCapable).bindPopup?.(name);

    // Highlight au survol
    layer.on("mouseover", (e) => {
      const target = e.target as Path;
      target.setStyle({ weight: 2, fillOpacity: 0.35 });
    });
    layer.on("mouseout", () => {
      if (geoRef.current) geoRef.current.resetStyle(layer as Layer);
    });

    // Interaction tactile/clic: sélection + recentrage
    layer.on("click", (e) => {
      const target = e.target as Path & { getBounds?: () => LatLngBounds; _map?: { fitBounds?: (b: LatLngBounds, opts?: FitBoundsOptions) => void } };
      // Met en évidence la commune sélectionnée
      target.setStyle({ fillOpacity: 0.6, weight: 2.5 });

      // Réinitialise les autres communes au style par défaut
      geoRef.current?.eachLayer((other: Layer) => {
        if (other !== target) geoRef.current?.resetStyle(other);
      });

      // Centre/zoom sur la commune sélectionnée
      const bounds = target.getBounds?.();
      if (bounds && target._map?.fitBounds)
        target._map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });

  // Ouvre le popup (utile sur mobile)
  (layer as unknown as PopupCapable).openPopup?.();
    });
  };

  return (
    <div
      aria-label="Carte des 21 communes couvertes"
      className="relative w-full"
      style={{ aspectRatio: "16/9" }}
    >
      <MapContainer
        center={[43.63, 3.43]}
        zoom={10}
        minZoom={8}
        maxZoom={16}
        zoomSnap={0.25}
        zoomDelta={0.5}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <FitBoundsOnData dep={data} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {data && (
          <GeoJSON
            data={data}
            style={style}
            onEachFeature={onEachFeature}
            ref={(ref) => {
              geoRef.current = (ref as unknown as LGeoJSON) || null;
            }}
          />
        )}
      </MapContainer>
      <p className="sr-only">Pincer pour zoomer, double‑tapez pour centrer, touchez une commune pour voir son nom.</p>
    </div>
  );
}
