# SPEC: F1 - 프로젝트 초기 설정

## Purpose

Next.js 기반 프로젝트를 생성하고, SQLite 데이터베이스, TypeScript, Tailwind CSS를 설정하여
이후 기능 개발의 기반을 마련한다.

## Flow Summary

1. Next.js 프로젝트 생성 (App Router, TypeScript, Tailwind CSS)
2. SQLite(better-sqlite3) + ws 패키지 설치
3. DB 초기화 유틸리티 및 스키마 정의
4. 타입 정의 (QueueItem, SongHistory, SingingSession, Comment)
5. 공통 레이아웃 및 헤더 컴포넌트 구성

## 범위 정의

### In Scope
- Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 프로젝트
- SQLite DB 연결 (better-sqlite3, WAL 모드)
- 테이블 스키마: queue_items, song_history, singing_session
- TypeScript 인터페이스 정의
- 루트 레이아웃 + 헤더 네비게이션
- Custom server (server.ts): Next.js + WebSocket 통합

### Out of Scope
- 개별 기능 구현 (F2~F6)
- 인증 (F7)
- 배포 (F8)

## 주요 파일

| 파일 | 역할 |
|------|------|
| `server.ts` | Custom HTTP + WebSocket 서버 |
| `src/lib/db.ts` | SQLite 싱글턴 연결 (`/data/songqueue.db`) |
| `src/lib/schema.ts` | 테이블 생성 DDL |
| `src/types/index.ts` | QueueItem, SongHistory, SingingSession, Comment |
| `src/app/layout.tsx` | 루트 레이아웃 (AdminProvider 포함) |
| `src/components/Layout/Header.tsx` | 네비게이션 헤더 |

## DB 스키마

```sql
-- queue_items: 노래 큐
CREATE TABLE queue_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_queue_items_position ON queue_items(position);

-- song_history: 완료된 노래 내역
CREATE TABLE song_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  song_title TEXT NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- singing_session: 현재 노래 세션 (0~1개)
CREATE TABLE singing_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  song_title TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Test Strategy

- T1: `npm run build` 성공
- T2: DB 파일 생성 및 테이블 존재 확인
- T3: 타입 import 정상 동작
