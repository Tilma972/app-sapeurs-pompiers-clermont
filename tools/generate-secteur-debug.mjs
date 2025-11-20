import fs from 'node:fs';

const FICHIER_COMMUNES_SOURCE = 'communes_secteur.json';

const SECTEURS_CONFIG = [
  { nom: 'Nord', communes: ['Lacoste', 'Brignac'], sous_secteurs: ['Secteur Nord'] },
  { nom: 'Ouest', communes: ['Salasc', 'Mérifons', 'Mourèze', 'Liausson', 'Villeneuvette', 'Valmascle'], sous_secteurs: ['Secteur Ouest'] },
  { nom: 'Sud', communes: ['Cabrières', 'Péret', 'Lieuran-Cabrières', 'Nébian'], sous_secteurs: ['Secteur Sud'] },
  { nom: 'Nord-Est', communes: ['Saint-Saturnin-de-Lucian', 'Saint-Guiraud', 'Saint-Félix-de-Lodez', 'Arboras', 'Ceyras', 'Jonquières'], sous_secteurs: [] },
  { nom: 'Sud-Est', communes: ['Canet'], sous_secteurs: [] }
];

function lireGeoJSON(filePath){
  return JSON.parse(fs.readFileSync(filePath,'utf8'));
}

const communesData = lireGeoJSON(FICHIER_COMMUNES_SOURCE);

for (const secteur of SECTEURS_CONFIG) {
  const featuresCommunes = communesData.features.filter(f => secteur.communes.includes(f.properties.name));
  console.log(secteur.nom + ' matched communes: ' + featuresCommunes.map(f=>f.properties.name).join(', '));
}
