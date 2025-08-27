// Usage: node create_graphs_sqlite.js [inputCsv] [outputSqlite]
// Example: node create_graphs_sqlite.js graph_assignments.csv data/graphs.sqlite

import fs from "fs";
import { parse } from "csv-parse";
import Database from "better-sqlite3";
import path from "path";

const inputCsv = process.argv[2] || 'postsurvey_graph_analysis.csv';
const outDbPath = process.argv[3] || path.join('data', 'graphs.sqlite');

if (!fs.existsSync(inputCsv)) {
  console.error(`Input CSV not found: ${inputCsv}`);
  process.exit(1);
}

if (!fs.existsSync(path.dirname(outDbPath))) {
  fs.mkdirSync(path.dirname(outDbPath), { recursive: true });
}

// Read CSV
const csvText = fs.readFileSync(inputCsv, 'utf8');

parse(csvText, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
  if (err) {
    console.error('CSV parse error:', err);
    process.exit(1);
  }

  // Determine canonical columns we want as separate fields
  const canonical = new Set(['id', 'filename', 'question', 'baseline_summary', 'optimized_summary', 'uses']);

  // Collect any other headers to store inside `meta_json`
  const headers = Object.keys(records[0] || {});
  const extraHeaders = headers.filter(h => !canonical.has(h));

  // Create DB and table
  const db = new Database(outDbPath);
  db.exec('PRAGMA journal_mode = WAL;');

  // Drop if exists (safe for regeneration)
  db.exec('DROP TABLE IF EXISTS graphs;');

  // Create graphs table: canonical columns + meta_json
  db.exec(`
    CREATE TABLE graphs (
      id INTEGER PRIMARY KEY,
      filename TEXT,
      question TEXT,
      baseline_summary TEXT,
      optimized_summary TEXT,
      uses INTEGER DEFAULT 0,
      meta_json TEXT
    );
  `);

  const insert = db.prepare(`
    INSERT INTO graphs (id, filename, question, baseline_summary, optimized_summary, uses, meta_json)
    VALUES (@id, @filename, @question, @baseline_summary, @optimized_summary, @uses, @meta_json)
  `);

  const insertMany = db.transaction((rows) => {
    for (const r of rows) insert.run(r);
  });

  // Map CSV rows -> DB rows
  const rows = records.map((rec, i) => {
    const id = rec.id ? Number(rec.id) : i + 1;
    const usesVal = rec.uses ? Number(rec.uses) : 0;

    // Build meta object with extra headers and their raw values
    const meta = {};
    for (const h of extraHeaders) {
      meta[h] = rec[h];
    }

    return {
      id,
      filename: rec.filename || '',
      question: rec.question || '',
      baseline_summary: rec.baseline_summary || '',
      optimized_summary: rec.optimized_summary || '',
      uses: Number.isFinite(usesVal) ? usesVal : 0,
      meta_json: Object.keys(meta).length ? JSON.stringify(meta) : null,
    };
  });

  insertMany(rows);
  db.close();
  console.log(`Wrote ${rows.length} rows to ${outDbPath}`);
});