import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '..', 'data', 'insee-communes.json');

async function fetchPopulation(code) {
  const url = `https://geo.api.gouv.fr/communes/${code}?fields=population`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.population === 'number' ? data.population : null;
  } catch (e) {
    console.error(`Erreur fetch ${code}:`, e.message || e);
    return null;
  }
}

const force = process.argv.includes('--force');

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error('Fichier introuvable:', filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    console.error('Impossible de parser JSON:', e.message);
    process.exit(1);
  }

  let changed = false;
  for (const item of arr) {
    if (!item.code) {
      console.warn(`Pas de code INSEE pour ${item.name}, saut.`);
      continue;
    }

    const shouldFetch = force || ((!item.population && item.population !== 0) || item.population === null);
    if (!shouldFetch) {
      // pas besoin de fetch si on n'est pas en mode force et que la population est déjà renseignée
      continue;
    }

    process.stdout.write(`Récupération ${item.name} (${item.code})... `);
    const pop = await fetchPopulation(item.code);
    if (pop !== null) {
      if (item.population !== pop) {
        item.population = pop;
        console.log(`OK -> ${pop}`);
        changed = true;
      } else {
        console.log(`inchangé -> ${pop}`);
      }
    } else {
      console.log('non trouvée');
    }
    // court délai pour éviter d'éventuels throttles
    await new Promise((r) => setTimeout(r, 200));
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2) + '\n', 'utf8');
    console.log('Fichier mis à jour:', filePath);
  } else {
    console.log('Aucune modification nécessaire.');
  }
}

// Node 18+ has global fetch. If not present, show helpful message.
if (typeof fetch !== 'function') {
  console.error('Ce script requiert Node.js v18+ (fetch global).');
  process.exit(1);
}

main().catch((e) => {
  console.error('Erreur:', e);
  process.exit(1);
});
