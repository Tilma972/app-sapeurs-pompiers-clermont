"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from "react-leaflet";
import { useEffect, useMemo, useRef } from "react";
import type { GeoJSON as LGeoJSON, PathOptions, StyleFunction, Layer, LeafletMouseEvent } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { Badge } from "@/components/ui/badge";

interface ZonesMapInnerProps {
  data: FeatureCollection<Geometry>;
}

function FitBoundsOnData({ data }: { data: FeatureCollection<Geometry> }) {
  const map = useMap();

  useEffect(() => {
    if (data.features.length === 0) return;

    // Calculer les bounds de toutes les features
    const bounds = data.features
      .map(f => f.geometry)
      .filter(g => g.type === 'Polygon' || g.type === 'MultiPolygon')
      .flatMap(g => {
        if (g.type === 'Polygon') {
          return g.coordinates[0];
        } else if (g.type === 'MultiPolygon') {
          return g.coordinates[0][0];
        }
        return [];
      })
      .map(coord => [coord[1], coord[0]] as [number, number]);

    if (bounds.length > 0) {
      const latLngs = bounds;
      try {
        map.fitBounds(latLngs, { padding: [50, 50], maxZoom: 14 });
      } catch {
        // Silencieux
      }
    }
  }, [data, map]);

  return null;
}

export default function ZonesMapInner({ data }: ZonesMapInnerProps) {
  const geoRef = useRef<LGeoJSON | null>(null);

  // Style en fonction du statut et de la couleur de l'équipe
  const style = useMemo<StyleFunction>(
    () => (feature) => {
      const props = feature?.properties;
      const statut = props?.statut as string;
      const couleurEquipe = props?.equipe_couleur as string | null;

      const fillColor = couleurEquipe || '#3b82f6';
      let fillOpacity = 0.4;

      // Modifier l'opacité selon le statut
      if (statut === 'Terminé') {
        fillOpacity = 0.7;
      } else if (statut === 'En cours') {
        fillOpacity = 0.5;
      } else if (statut === 'À faire') {
        fillOpacity = 0.2;
      }

      const s: PathOptions = {
        color: couleurEquipe || '#3b82f6',
        weight: 2,
        fillColor,
        fillOpacity,
        className: "cursor-pointer transition-all hover:fillOpacity-70",
      };
      return s;
    },
    []
  );

  // Gestion du hover
  const onEachFeature = useMemo(
    () => (feature: Feature<Geometry>, layer: Layer) => {
      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          const targetLayer = e.target;
          targetLayer.setStyle({
            weight: 3,
            fillOpacity: 0.7,
          });
        },
        mouseout: (e: LeafletMouseEvent) => {
          if (geoRef.current) {
            geoRef.current.resetStyle(e.target);
          }
        },
      });
    },
    []
  );

  if (!data || data.features.length === 0) {
    return (
      <div className="w-full h-[500px] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Aucune zone à afficher</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        center={[43.63, 3.43]}
        zoom={12}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          ref={geoRef}
          data={data}
          style={style}
          onEachFeature={onEachFeature}
        >
          {data.features.map((feature, idx) => {
            const props = feature.properties;
            if (!props) return null;

            return (
              <Popup key={idx}>
                <div className="space-y-2 min-w-[200px]">
                  <div>
                    <p className="font-semibold text-sm">{props.code_zone}</p>
                    <p className="text-xs text-muted-foreground">{props.nom_zone}</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Équipe:</span>
                      <span className="font-medium">{props.equipe_nom || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pompier:</span>
                      <span className="font-medium">{props.pompier_nom || 'Non assigné'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Population:</span>
                      <span className="font-medium">{props.population_estimee || 0} hab</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calendriers:</span>
                      <span className="font-medium">
                        {props.nb_calendriers_distribues || 0}/{props.nb_calendriers_alloues || 0}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Badge
                      variant={
                        props.statut === 'Terminé' ? 'default' :
                        props.statut === 'En cours' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {props.statut}
                    </Badge>
                  </div>
                </div>
              </Popup>
            );
          })}
        </GeoJSON>
        <FitBoundsOnData data={data} />
      </MapContainer>
    </div>
  );
}
