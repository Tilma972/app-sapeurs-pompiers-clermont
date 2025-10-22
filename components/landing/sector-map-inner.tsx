"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSON as LGeoJSON, PathOptions, Layer, Path } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const GEOJSON_URL =
  "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/21_communes/communes_secteur.json";

export default function SectorMapInner() {
  const [data, setData] = useState<FeatureCollection<Geometry> | null>(null);
  const geoRef = useRef<LGeoJSON | null>(null);
  
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
      .then((json) => {
        if (!cancelled) setData(json);
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

  const style = useMemo<() => PathOptions>(
    () => () => ({
      color: "#d11",
      weight: 1.2,
      fillColor: "#f66",
      fillOpacity: 0.25,
    }),
    []
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
