import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export interface SongHistory {
  id: number;
  name: string;
  reason: string;
  song_title: string;
  completed_at: string;
  youtube_video_id: string | null;
}

export interface SingingSession {
  id: number;
  name: string;
  reason: string;
  song_title: string;
  started_at: string;
  youtube_video_id: string | null;
}

export async function POST(request: NextRequest) {
  // Verify admin password
  const password = request.headers.get('x-admin-password');
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 401 });
  }

  try {
    const db = getDb();

    // 트랜잭션 시작
    const result = db.transaction(() => {
      // 1. 현재 진행 중인 세션 조회
      const session = db.prepare('SELECT * FROM singing_session LIMIT 1').get() as SingingSession | undefined;

      if (!session) {
        return { error: '진행 중인 노래가 없습니다', status: 404 };
      }

      // 2. song_history에 삽입
      const insertStmt = db.prepare(`
        INSERT INTO song_history (name, reason, song_title, youtube_video_id)
        VALUES (?, ?, ?, ?)
      `);

      const info = insertStmt.run(session.name, session.reason, session.song_title, session.youtube_video_id || null);

      // 3. singing_session에서 삭제
      db.prepare('DELETE FROM singing_session WHERE id = ?').run(session.id);

      // 4. 삽입된 내역 조회
      const history = db.prepare('SELECT * FROM song_history WHERE id = ?').get(info.lastInsertRowid) as SongHistory;

      return { history };
    })();

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Complete song error:', error);
    return NextResponse.json(
      { error: '노래 완료 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
