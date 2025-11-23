#!/usr/bin/env node

/**
 * Script GeoJSON (une commune) → SQL INSERT zones_tournees
 *
 * Usage :
 * node tools/geojson-commune-to-sql.mjs decoupe_peret.geojson \
 *   --equipe-id e18075b3-27e5-4f0b-bbb2-f1980c0962cd \
 *   --output import_peret.sql
 */

import fs from "node:fs";
import path from "node:path";

class Logger {
    static info(msg) {
        console.log(`ℹ️ ${msg}`);
    }
    static success(msg) {
        console.log(`✅ ${msg}`);
    }
    static error(msg) {
        console.error(`❌ ${msg}`);
    }
    static warn(msg) {
        console.warn(`⚠️ ${msg}`);
    }
}

function printUsage() {
    console.log(`
Usage: node tools/geojson-commune-to-sql.mjs <fichier.geojson> --equipe-id <uuid> [options]

Arguments:
  fichier.geojson         Fichier GeoJSON de découpe d'une commune (zones S-01..S-0X)

Options:
  --equipe-id, -e         UUID de l'équipe (zones_tournees.equipe_id)
  --annee, -y             Année de la campagne (défaut: année courante)
  --output, -o            Nom du fichier SQL de sortie (défaut: import_zones_<commune>.sql)
  --help, -h              Affiche cette aide

Exemple:
  node tools/geojson-commune-to-sql.mjs decoupe_peret.geojson \\
    --equipe-id e18075b3-27e5-4f0b-bbb2-f1980c0962cd \\
    --output import_peret.sql
`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        printUsage();
        process.exit(0);
    }

    const options = {
        fichierEntree: null,
        equipeId: null,
        annee: new Date().getFullYear(),
        fichierSortie: null,
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (!options.fichierEntree && !arg.startsWith("-")) {
            options.fichierEntree = arg;
        } else if (arg === "--equipe-id" || arg === "-e") {
            options.equipeId = args[++i];
        } else if (arg === "--annee" || arg === "-y") {
            options.annee = parseInt(args[++i], 10);
        } else if (arg === "--output" || arg === "-o") {
            options.fichierSortie = args[++i];
        } else {
            Logger.error(`Option inconnue: ${arg}`);
            printUsage();
            process.exit(1);
        }
        i++;
    }

    if (!options.fichierEntree) {
        Logger.error("Fichier GeoJSON requis.");
        printUsage();
        process.exit(1);
    }
    if (!options.equipeId) {
        Logger.error("L'option --equipe-id est requise.");
        printUsage();
        process.exit(1);
    }

    return options;
}

function escapeString(str) {
    if (!str) return "";
    return String(str).replace(/'/g, "''");
}

function normalizeProps(rawProps = {}) {
    // Normalisation des clés (pour gérer "commune " vs "commune")
    const props = {};

    // Recrée un objet avec clés trimées
    for (const [k, v] of Object.entries(rawProps)) {
        props[k.trim()] = v;
    }

    // Aliases possibles pour population
    if (props.population_estimee == null && props["population estimee"] != null) {
        props.population_estimee = props["population estimee"];
    }

    if (!props.code_zone) {
        throw new Error("code_zone manquant");
    }
    if (!props.nom_zone) {
        throw new Error("nom_zone manquant");
    }
    if (!props.commune) {
        throw new Error("commune manquante (clé 'commune')");
    }

    const population =
        typeof props.population_estimee === "number"
            ? props.population_estimee
            : parseInt(props.population_estimee ?? "0", 10) || 0;

    return {
        code_zone: String(props.code_zone),
        nom_zone: String(props.nom_zone),
        commune: String(props.commune),
        description:
            props.description || `Zone ${props.commune} - ${props.nom_zone}`,
        population_estimee: population,
    };
}

function generateSQL(geojson, equipeId, annee) {
    const date = new Date().toISOString().split("T")[0];

    let sql = `-- Import des zones de tournée (commune)
-- Date: ${date}
-- Equipe: ${equipeId}
-- ============================================================================

`;

    let validCount = 0;
    let totalPopulation = 0;

    for (const [index, feature] of geojson.features.entries()) {
        // On ignore éventuellement un premier feature de "secteur" global
        if (!feature.properties || feature.properties.secteur_nom) {
            continue;
        }

        try {
            const props = normalizeProps(feature.properties);
            const codeZone = escapeString(props.code_zone);
            const nomZone = escapeString(props.nom_zone);
            const description = escapeString(props.description);
            const population = props.population_estimee;

            totalPopulation += population;
            validCount++;

            const geomJson = JSON.stringify(feature).replace(/'/g, "''");

            sql += `
-- Zone ${validCount}: ${props.code_zone} - ${props.nom_zone}
INSERT INTO public.zones_tournees (
  equipe_id,
  code_zone,
  nom_zone,
  description,
  geom,
  population_estimee,
  annee,
  statut
) VALUES (
  '${equipeId}',
  '${codeZone}',
  '${nomZone}',
  '${description}',
  '${geomJson}'::jsonb,
  ${population},
  ${annee},
  'À faire'
)
ON CONFLICT (code_zone) DO UPDATE SET
  nom_zone = EXCLUDED.nom_zone,
  description = EXCLUDED.description,
  geom = EXCLUDED.geom,
  population_estimee = EXCLUDED.population_estimee,
  updated_at = NOW();
`;
        } catch (err) {
            Logger.error(
                `Zone ${index + 1} ignorée (propriétés invalides): ${err.message}`
            );
        }
    }

    const moyennePopulation =
        validCount > 0 ? Math.round(totalPopulation / validCount) : 0;
    const totalCalendriers = Math.round(totalPopulation / 6.5);

    sql += `

-- ========================================================================
-- Résumé
-- ========================================================================
-- Zones valides: ${validCount}
-- Population totale estimée: ${totalPopulation}
-- Moyenne par zone: ${moyennePopulation}
-- Calendriers estimés (≈ 1 pour 6.5 hab): ${totalCalendriers}

`;

    return sql;
}

async function main() {
    console.log("\n🔥 Conversion GeoJSON commune → SQL zones_tournees\n");

    const options = parseArgs();
    const { fichierEntree, equipeId, annee, fichierSortie } = options;

    if (!fs.existsSync(fichierEntree)) {
        Logger.error(`Fichier introuvable: ${fichierEntree}`);
        process.exit(1);
    }

    Logger.info(`Lecture du fichier: ${fichierEntree}`);
    let geojson;
    try {
        const content = fs.readFileSync(fichierEntree, "utf-8");
        geojson = JSON.parse(content);
    } catch (error) {
        Logger.error(`Impossible de lire le fichier: ${error.message}`);
        process.exit(1);
    }

    if (!geojson.features || !Array.isArray(geojson.features)) {
        Logger.error('Format GeoJSON invalide: "features" manquant ou invalide');
        process.exit(1);
    }

    Logger.success(`${geojson.features.length} feature(s) trouvée(s)`);

    const baseName = path.basename(fichierEntree, ".geojson");
    const outName =
        fichierSortie || `import_zones_${baseName.replace(/[^a-z0-9]/gi, "_")}.sql`;
    const outPath = path.join(process.cwd(), outName);

    const sql = generateSQL(geojson, equipeId, annee);

    fs.writeFileSync(outPath, sql, "utf-8");
    Logger.success(`Fichier SQL généré: ${outPath}\n`);
}

main().catch((err) => {
    Logger.error(err.message);
    process.exit(1);
});
