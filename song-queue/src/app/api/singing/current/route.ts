import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    const session = db.prepare(
      'SELECT id, name, reason, song_title, started_at, youtube_video_id FROM singing_session LIMIT 1'
    ).get();

    return NextResponse.json({ session: session || null });
  } catch (error) {
    console.error('현재 세션 조회 실패:', error);
    return NextResponse.json(
      { error: '세션 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
