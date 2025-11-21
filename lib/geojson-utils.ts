import type { Geometry } from "geojson";

/**
 * Extraire la géométrie depuis différents formats GeoJSON
 * Gère les cas suivants:
 * - String JSON sérialisé
 * - Feature GeoJSON complète (extrait .geometry)
 * - Geometry directe (Polygon, MultiPolygon, etc.)
 */
export function extractGeometry(geom: unknown): Geometry | null {
  if (!geom) return null;

  let parsed = geom;

  // 1. Parser si c'est une string JSON
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      console.error("Failed to parse geom JSON:", error);
      return null;
    }
  }

  // 2. Vérifier la structure
  const obj = parsed as Record<string, unknown>;

  // Cas A: C'est une Feature GeoJSON complète → extraire .geometry
  if (obj.type === 'Feature' && obj.geometry) {
    return obj.geometry as Geometry;
  }

  // Cas B: C'est une FeatureCollection → extraire la première feature
  if (obj.type === 'FeatureCollection' && Array.isArray(obj.features) && obj.features.length > 0) {
    const firstFeature = obj.features[0] as Record<string, unknown>;
    if (firstFeature.geometry) {
      return firstFeature.geometry as Geometry;
    }
  }

  // Cas C: C'est directement une Geometry (Polygon, MultiPolygon, etc.)
  if (obj.type && ['Polygon', 'MultiPolygon', 'Point', 'LineString', 'MultiLineString', 'MultiPoint', 'GeometryCollection'].includes(obj.type as string)) {
    // ✅ CORRECTION : Double cast pour satisfaire TypeScript
    return obj as unknown as Geometry;
  }

  console.error("Unknown geom format:", obj);
  return null;
}
