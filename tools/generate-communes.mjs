// tools/generate-communes.mjs
// Usage: node tools/generate-communes.mjs Nomdelacommune-CodeINSEE.csv communes_secteur.json
import fs from "node:fs";
import path from "node:path";
import { parse } from "node:querystring";
import https from "node:https";

const [,, csvPath, outPath] = process.argv;
if (!csvPath || !outPath) {
  console.error("Usage: node tools/generate-communes.mjs <csv_insee> <out_geojson>");
  process.exit(1);
}

// 1) Lire les codes INSEE depuis le CSV
const csv = fs.readFileSync(csvPath, "utf8");
const inseeSet = new Set(
  csv.split("\n")
    .slice(1)
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.split(",")[1]?.replaceAll('"',"").trim())
    .filter(Boolean)
);

// 2) Télécharger le GeoJSON national (ajuste l’URL si le fichier évolue)
const COMMUNES_URL = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes.geojson";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

const data = await fetchJson(COMMUNES_URL);

// 3) Filtrer par codes INSEE (les propriétés peuvent se nommer code, insee, code_insee selon la source)
const features = data.features.filter(f => {
  const p = f.properties || {};
  const code =
    p.code_insee || p.codeInsee || p.code || p.insee || p.INSEE || p.Commune || null;
  return code && inseeSet.has(String(code));
});

// 4) Construire le FeatureCollection final
const output = {
  type: "FeatureCollection",
  features: features.map(f => ({
    type: "Feature",
    geometry: f.geometry,
    properties: {
      name: f.properties?.nom || f.properties?.name || f.properties?.NOM || "Commune",
      insee: f.properties?.code_insee || f.properties?.code || f.properties?.insee || null
    }
  }))
};

fs.writeFileSync(outPath, JSON.stringify(output));
console.log(`OK: écrit ${features.length} communes dans ${outPath}`);
