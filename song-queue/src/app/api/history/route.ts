import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export interface SongHistory {
  id: number;
  name: string;
  reason: string;
  song_title: string;
  completed_at: string;
}

export async function GET() {
  try {
    const db = getDb();

    const items = db.prepare('SELECT * FROM song_history ORDER BY completed_at DESC').all() as SongHistory[];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: '노래 내역 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
