export const QUEUE_ITEMS_TABLE = `
CREATE TABLE IF NOT EXISTS queue_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const QUEUE_ITEMS_INDEX = `
CREATE INDEX IF NOT EXISTS idx_queue_items_position ON queue_items(position);
`;

export const SONG_HISTORY_TABLE = `
CREATE TABLE IF NOT EXISTS song_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  song_title TEXT NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const SINGING_SESSION_TABLE = `
CREATE TABLE IF NOT EXISTS singing_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  song_title TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const initializeSchema = (db: any) => {
  db.exec(QUEUE_ITEMS_TABLE);
  db.exec(QUEUE_ITEMS_INDEX);
  db.exec(SONG_HISTORY_TABLE);
  db.exec(SINGING_SESSION_TABLE);

  // F10: youtube_video_id 컬럼 추가 마이그레이션
  try {
    db.exec('ALTER TABLE singing_session ADD COLUMN youtube_video_id TEXT');
  } catch {
    // 이미 존재하면 무시
  }
  try {
    db.exec('ALTER TABLE song_history ADD COLUMN youtube_video_id TEXT');
  } catch {
    // 이미 존재하면 무시
  }
  
  // DnD 지원: queue_items 테이블에 position 컬럼 추가 (기존 DB 대응)
  try {
    db.exec('ALTER TABLE queue_items ADD COLUMN position INTEGER DEFAULT 0');
  } catch {
    // 이미 존재하거나 테이블이 없으면 무시
  }
};
