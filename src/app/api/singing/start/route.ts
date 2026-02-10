import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { song_title } = body;

    // Validate song_title
    if (!song_title || song_title.trim() === '') {
      return NextResponse.json(
        { error: '노래 제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Start transaction
    const result = db.transaction(() => {
      // Check if there's already a singing session
      const existingSession = db.prepare('SELECT id FROM singing_session LIMIT 1').get() as { id: number } | undefined;
      if (existingSession) {
        throw new Error('ALREADY_SINGING');
      }

      // Get the first item in queue (position = 0)
      const nextItem = db.prepare(
        'SELECT id, name, reason FROM queue_items ORDER BY position ASC LIMIT 1'
      ).get() as { id: number; name: string; reason: string } | undefined;

      if (!nextItem) {
        throw new Error('QUEUE_EMPTY');
      }

      // Delete the item from queue
      db.prepare('DELETE FROM queue_items WHERE id = ?').run(nextItem.id);

      // Update positions of remaining items
      db.prepare('UPDATE queue_items SET position = position - 1').run();

      // Insert into singing_session
      const insertResult = db.prepare(
        'INSERT INTO singing_session (name, reason, song_title) VALUES (?, ?, ?)'
      ).run(nextItem.name, nextItem.reason, song_title.trim());

      // Get the newly created session
      const session = db.prepare(
        'SELECT id, name, reason, song_title, started_at FROM singing_session WHERE id = ?'
      ).get(insertResult.lastInsertRowid) as {
        id: number;
        name: string;
        reason: string;
        song_title: string;
        started_at: string;
      };

      return session;
    })();

    return NextResponse.json({ session: result });
  } catch (error: any) {
    if (error.message === 'ALREADY_SINGING') {
      return NextResponse.json(
        { error: '이미 노래 중입니다' },
        { status: 409 }
      );
    }
    if (error.message === 'QUEUE_EMPTY') {
      return NextResponse.json(
        { error: '큐가 비어있습니다' },
        { status: 404 }
      );
    }
    console.error('노래 시작 실패:', error);
    return NextResponse.json(
      { error: '노래 시작에 실패했습니다.' },
      { status: 500 }
    );
  }
}
