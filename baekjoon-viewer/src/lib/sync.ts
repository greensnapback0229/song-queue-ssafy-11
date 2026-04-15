import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const PROBLEMS_DIR = process.env.PROBLEMS_DIR || "/data/problems";
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "baekjoon.db");

interface Metadata {
  problem_id: number;
  title: string;
  time_limit?: string;
  memory_limit?: string;
  tier?: number;
  tier_name?: string;
  tags?: string[];
  samples?: { input: string; output: string }[];
  source?: string[];
  image_count?: number;
}

export function syncProblems() {
  console.log(`[Sync] Starting sync from ${PROBLEMS_DIR}...`);
  const start = Date.now();

  if (!fs.existsSync(PROBLEMS_DIR)) {
    console.error(`[Sync] Problems directory not found: ${PROBLEMS_DIR}`);
    return { added: 0, updated: 0, error: "Directory not found" };
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      problem_id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      time_limit TEXT,
      memory_limit TEXT,
      tier INTEGER DEFAULT 0,
      tier_name TEXT DEFAULT 'Unrated',
      tags TEXT DEFAULT '[]',
      samples TEXT DEFAULT '[]',
      source TEXT DEFAULT '[]',
      image_count INTEGER DEFAULT 0,
      html_path TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tier ON problems(tier);
    CREATE INDEX IF NOT EXISTS idx_title ON problems(title);
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const existingIds = new Set(
    (db.prepare("SELECT problem_id FROM problems").all() as { problem_id: number }[]).map(
      (r) => r.problem_id
    )
  );

  const entries = fs.readdirSync(PROBLEMS_DIR).filter((e) => {
    return /^\d+$/.test(e) && fs.statSync(path.join(PROBLEMS_DIR, e)).isDirectory();
  });

  const upsert = db.prepare(`
    INSERT INTO problems (problem_id, title, time_limit, memory_limit, tier, tier_name, tags, samples, source, image_count, html_path, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(problem_id) DO UPDATE SET
      title=excluded.title, time_limit=excluded.time_limit, memory_limit=excluded.memory_limit,
      tier=excluded.tier, tier_name=excluded.tier_name, tags=excluded.tags,
      samples=excluded.samples, source=excluded.source, image_count=excluded.image_count,
      html_path=excluded.html_path, updated_at=excluded.updated_at
  `);

  let added = 0;
  let updated = 0;

  const batchInsert = db.transaction((batch: Metadata[]) => {
    for (const meta of batch) {
      const htmlPath = path.join(PROBLEMS_DIR, String(meta.problem_id), "problem.html");
      const hasHtml = fs.existsSync(htmlPath);

      upsert.run(
        meta.problem_id,
        meta.title,
        meta.time_limit || "",
        meta.memory_limit || "",
        meta.tier || 0,
        meta.tier_name || "Unrated",
        JSON.stringify(meta.tags || []),
        JSON.stringify(meta.samples || []),
        JSON.stringify(meta.source || []),
        meta.image_count || 0,
        hasHtml ? htmlPath : null
      );

      if (existingIds.has(meta.problem_id)) {
        updated++;
      } else {
        added++;
      }
    }
  });

  const BATCH_SIZE = 500;
  let batch: Metadata[] = [];

  for (const entry of entries) {
    const metaPath = path.join(PROBLEMS_DIR, entry, "metadata.json");
    if (!fs.existsSync(metaPath)) continue;

    try {
      const raw = fs.readFileSync(metaPath, "utf-8");
      const meta: Metadata = JSON.parse(raw);
      batch.push(meta);

      if (batch.length >= BATCH_SIZE) {
        batchInsert(batch);
        batch = [];
      }
    } catch (err) {
      console.warn(`[Sync] Failed to parse ${metaPath}:`, err);
    }
  }

  if (batch.length > 0) {
    batchInsert(batch);
  }

  db.prepare(
    "INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_sync', ?)"
  ).run(new Date().toISOString());

  db.prepare(
    "INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('total_problems', ?)"
  ).run(String(existingIds.size + added));

  db.close();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[Sync] Done in ${elapsed}s. Added: ${added}, Updated: ${updated}, Total: ${existingIds.size + added}`);

  return { added, updated, total: existingIds.size + added };
}

if (require.main === module) {
  syncProblems();
}
