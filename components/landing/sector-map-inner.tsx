"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSON as LGeoJSON, PathOptions, Layer, Path, StyleFunction, LatLngBounds, FitBoundsOptions } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const GEOJSON_URL =
  "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/21_communes/communes_secteur.json";

export default function SectorMapInner() {
  const [data, setData] = useState<FeatureCollection<Geometry, Record<string, unknown>> | null>(null);
  const geoRef = useRef<LGeoJSON | null>(null);
  
  // Palette de 21 couleurs distinctes
  const communeColors = useMemo(
    () => [
      "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
      "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
      "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5",
      "#c49c94", "#f7b6d2", "#c7c7c7", "#dbdb8d", "#9edae5",
      "#393b79",
    ],
    []
  );
  
  function FitBoundsOnData({ dep }: { dep: unknown }) {
    const map = useMap();
    useEffect(() => {
      if (geoRef.current) {
        try {
          const bounds = geoRef.current.getBounds();
          // Calcule un zoom un cran plus proche que le fitBounds par défaut
          const baseZoom = map.getBoundsZoom(bounds);
          const closerZoom = Math.min(14, baseZoom + 1);
          const center = bounds.getCenter();
          map.setView(center, closerZoom, { animate: false });
        } catch {}
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dep]);
    return null;
  }

  useEffect(() => {
    let cancelled = false;
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((json: FeatureCollection<Geometry, Record<string, unknown>>) => {
        if (cancelled) return;
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
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultPathStyle: PathOptions = {
    color: "#d11",
    weight: 1.2,
    fillColor: "#f66",
    fillOpacity: 0.25,
  };

  // Style par feature en fonction de l'index (couleur différente par commune)
  const style = useMemo<StyleFunction>(
    () => (feature) => {
      const idx = (feature?.properties as Record<string, unknown> | undefined)?.colorIndex as number | undefined;
      const color = communeColors[(idx ?? 0) % communeColors.length];
      const s: PathOptions = {
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.3,
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

  const onEachFeature = (
    feature: Feature<Geometry, Record<string, unknown>>,
    layer: Layer
  ) => {
    // Tooltip avec le nom de commune (collant au curseur)
    const name = getCommuneName(feature);
    const tl = layer as unknown as TooltipCapable;
    tl.bindTooltip?.(name, { sticky: true, direction: "top" });

    // Highlight au survol
    layer.on("mouseover", (e) => {
      const target = e.target as Path;
      target.setStyle({ weight: 2, fillOpacity: 0.35 });
    });
    layer.on("mouseout", (e) => {
      const target = e.target as Path;
      target.setStyle(defaultPathStyle);
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
      if (bounds && target._map?.fitBounds) target._map.fitBounds(bounds, { padding: [30, 30] });
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
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <FitBoundsOnData dep={data} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
    </div>
  );
}
