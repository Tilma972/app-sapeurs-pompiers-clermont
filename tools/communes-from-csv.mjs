#!/usr/bin/env node
/**
 * Sync data/communes-21.json from Nomdelacommune-CodeINSEE.csv (source of truth for names + INSEE codes)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CSV_PATH = path.join(ROOT, 'Nomdelacommune-CodeINSEE.csv');
const OUT_PATH = path.join(ROOT, 'data', 'communes-21.json');

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  // Expect header: "Nom de la commune","Code INSEE"
  const dataLines = lines.slice(1);
  const items = [];
  for (const line of dataLines) {
    // Simple CSV with quotes and comma
    const m = line.match(/^"(.+?)","(\d+)"$/);
    if (!m) continue;
    const name = m[1];
    const code = m[2];
    items.push({ name, code });
  }
  return items;
}

try {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const items = parseCsv(csv);
  if (!items.length) {
    console.error('No communes parsed from CSV. Aborting.');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(items, null, 2), 'utf8');
  console.log(`✅ Synced ${items.length} communes to ${path.relative(ROOT, OUT_PATH)}`);
} catch (err) {
  console.error('Failed to sync communes from CSV:', err.message);
  process.exit(1);
}
