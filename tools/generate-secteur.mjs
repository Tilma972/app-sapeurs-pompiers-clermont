// tools/generate-secteur.mjs
import fs from 'node:fs';

// Définissez ici les communes du secteur que vous voulez extraire
const communesDuSecteur = new Set([
  'Saint-Saturnin-de-Lucian',
  'Saint-Guiraud',
  'Saint-Félix-de-Lodez',
  'Arboras'
]);

// Chemin vers votre fichier GeoJSON complet
const fichierSource = 'communes_secteur.json';
// Nom du fichier de sortie
const fichierDestination = 'secteur_nord.json';

console.log(`Lecture de ${fichierSource}...`);
const data = JSON.parse(fs.readFileSync(fichierSource, 'utf8'));

const featuresFiltrees = data.features.filter(feature => 
  communesDuSecteur.has(feature.properties.name)
);

if (featuresFiltrees.length === 0) {
  console.error("Aucune commune correspondante trouvée. Vérifiez les noms dans 'communesDuSecteur'.");
  process.exit(1);
}

const output = {
  type: 'FeatureCollection',
  features: featuresFiltrees
};

fs.writeFileSync(fichierDestination, JSON.stringify(output, null, 2));
console.log(`OK : ${featuresFiltrees.length} communes écrites dans ${fichierDestination}`);
