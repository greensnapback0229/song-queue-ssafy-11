import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { initializeSchema } from './schema';

let db: Database.Database | null = null;

export const getDb = (): Database.Database => {
  if (db) {
    return db;
  }

  // 프로젝트 루트의 data/ 디렉토리
  const dataDir = path.join(process.cwd(), 'data');

  // data/ 디렉토리가 없으면 생성
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'songqueue.db');

  // DB 연결 생성
  db = new Database(dbPath);

  // WAL 모드 활성화
  db.pragma('journal_mode = WAL');

  // 스키마 초기화
  initializeSchema(db);

  return db;
};

// 프로세스 종료 시 DB 연결 정리
process.on('exit', () => {
  if (db) {
    db.close();
  }
});
