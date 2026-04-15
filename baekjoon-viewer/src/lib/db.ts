import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "baekjoon.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("synchronous = NORMAL");
    initDb(_db);
  }
  return _db;
}

function initDb(db: Database.Database) {
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
}

export interface ProblemRow {
  problem_id: number;
  title: string;
  time_limit: string;
  memory_limit: string;
  tier: number;
  tier_name: string;
  tags: string;
  samples: string;
  source: string;
  image_count: number;
  html_path: string;
  updated_at: string;
}

export interface ProblemListQuery {
  page?: number;
  limit?: number;
  tier?: number;
  tag?: string;
  search?: string;
}

export function getProblems(query: ProblemListQuery) {
  const db = getDb();
  const { page = 1, limit = 50, tier, tag, search } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (tier !== undefined && tier >= 0) {
    conditions.push("tier = ?");
    params.push(tier);
  }

  if (tag) {
    conditions.push("tags LIKE ?");
    params.push(`%"${tag}"%`);
  }

  if (search) {
    conditions.push("(title LIKE ? OR CAST(problem_id AS TEXT) LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM problems ${where}`)
    .get(...params) as { cnt: number };

  const rows = db
    .prepare(`SELECT * FROM problems ${where} ORDER BY problem_id ASC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as ProblemRow[];

  return {
    problems: rows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags),
      samples: JSON.parse(r.samples),
      source: JSON.parse(r.source),
    })),
    total: countRow.cnt,
    page,
    totalPages: Math.ceil(countRow.cnt / limit),
  };
}

export function getProblem(id: number) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM problems WHERE problem_id = ?").get(id) as ProblemRow | undefined;
  if (!row) return null;
  return {
    ...row,
    tags: JSON.parse(row.tags),
    samples: JSON.parse(row.samples),
    source: JSON.parse(row.source),
  };
}

export function getAllTags(): { tag: string; count: number }[] {
  const db = getDb();
  const rows = db.prepare("SELECT tags FROM problems").all() as { tags: string }[];
  const tagMap = new Map<string, number>();
  for (const row of rows) {
    const tags: string[] = JSON.parse(row.tags);
    for (const t of tags) {
      tagMap.set(t, (tagMap.get(t) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getTierStats(): { tier: number; tier_name: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT tier, tier_name, COUNT(*) as count FROM problems GROUP BY tier ORDER BY tier ASC"
    )
    .all() as { tier: number; tier_name: string; count: number }[];
}
