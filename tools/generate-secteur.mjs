// tools/generate-secteurs.mjs
import fs from 'node:fs';
import path from 'node:path';

// --- CONFIGURATION ---
const FICHIER_COMMUNES_SOURCE = 'communes_secteur.json';
const FICHIER_SOUS_SECTEURS_SOURCE = 'clermont_3_secteurs.geojson';
const DOSSIER_SORTIE = 'public/sectors';

const SECTEURS_CONFIG = [
  {
    nom: 'Secteur Nord',
    communes: ['Lacoste', 'Brignac', 'Jonquières'],
    sous_secteurs: ['Secteur Nord'],
  },
  {
    nom: 'Secteur Ouest',
    communes: ['Octon', 'Salasc', 'Mérifons', 'Mourèze', 'Liausson', 'Villeneuvette', 'Valmascle'],
    sous_secteurs: ['Secteur Ouest'],
  },
  {
    nom: 'Secteur Sud',
    communes: ['Cabrières', 'Péret', 'Lieuran-Cabrières', 'Nébian'],
    sous_secteurs: ['Secteur Sud'],
  },
  {
    nom: 'Secteur Nord-Est',
    communes: ['Saint-Saturnin-de-Lucian', 'Saint-Guiraud', 'Saint-Félix-de-Lodez', 'Arboras', 'Ceyras'],
    sous_secteurs: [],
  },
  {
    nom: 'Secteur Sud-Est',
    communes: ['Canet'],
    sous_secteurs: [],
  },
];
// --- FIN DE LA CONFIGURATION ---

function lireGeoJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erreur : Impossible de lire le fichier ${filePath}.`);
    console.error(error.message);
    process.exit(1);
  }
}

function main() {
  console.log('--- Lancement du script de génération des secteurs ---');

  const communesData = lireGeoJSON(FICHIER_COMMUNES_SOURCE);
  const sousSecteursData = lireGeoJSON(FICHIER_SOUS_SECTEURS_SOURCE);

  if (!fs.existsSync(DOSSIER_SORTIE)) {
    fs.mkdirSync(DOSSIER_SORTIE, { recursive: true });
    console.log(`Dossier de sortie créé : ${DOSSIER_SORTIE}`);
  }

  for (const secteur of SECTEURS_CONFIG) {
    console.log(`\nTraitement du : ${secteur.nom}...`);
    let featuresDuSecteur = [];

    // 1. Ajouter les communes entières
    const featuresCommunes = communesData.features.filter(f =>
      secteur.communes.includes(f.properties.name)
    );
    if (featuresCommunes.length > 0) {
      featuresDuSecteur.push(...featuresCommunes);
      console.log(`  - ${featuresCommunes.length} commune(s) ajoutée(s).`);
    }

    // 2. Ajouter les sous-secteurs de Clermont
    const featuresSousSecteurs = sousSecteursData.features.filter(f =>
      secteur.sous_secteurs.includes(f.properties.secteur_nom)
    );
    if (featuresSousSecteurs.length > 0) {
      featuresDuSecteur.push(...featuresSousSecteurs);
      console.log(`  - ${featuresSousSecteurs.length} sous-secteur(s) de Clermont ajouté(s).`);
    }

    // 3. Créer le nouveau GeoJSON pour le secteur
    const nouveauGeoJSON = {
      type: 'FeatureCollection',
      features: featuresDuSecteur,
    };

    // 4. Écrire le fichier
    const nomFichierSortie = `${secteur.nom.toLowerCase()}.geojson`;
    const cheminFichierSortie = path.join(DOSSIER_SORTIE, nomFichierSortie);
    
    fs.writeFileSync(cheminFichierSortie, JSON.stringify(nouveauGeoJSON, null, 2));
    console.log(`  => Fichier généré : ${cheminFichierSortie}`);
  }

  console.log('\n--- Script terminé avec succès ! ---');
}

main();
