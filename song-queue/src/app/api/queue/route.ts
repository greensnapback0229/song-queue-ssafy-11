import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { QueueItem } from '@/types';
import { verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const items = db.prepare('SELECT * FROM queue_items ORDER BY position ASC').all() as QueueItem[];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/queue error:', error);
    return NextResponse.json(
      { error: '큐 목록을 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Verify admin password
  const password = request.headers.get('x-admin-password');
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, reason, direction = 'back' } = body;

    // 입력 검증
    const trimmedName = name?.trim();
    const trimmedReason = reason?.trim();

    if (!trimmedName || !trimmedReason) {
      return NextResponse.json(
        { error: '이름과 벌칙 사유를 입력해주세요' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 트랜잭션으로 삽입 처리
    const insertItem = db.transaction((name: string, reason: string, direction: string) => {
      let position: number;
      let item: QueueItem;

      if (direction === 'front') {
        // 앞에 추가: 모든 기존 항목의 position을 1씩 증가
        db.prepare('UPDATE queue_items SET position = position + 1').run();
        position = 0;
      } else {
        // 뒤에 추가: 최대 position + 1
        const result = db.prepare('SELECT MAX(position) as maxPos FROM queue_items').get() as { maxPos: number | null };
        position = result.maxPos !== null ? result.maxPos + 1 : 0;
      }

      // 새 항목 삽입
      const insertResult = db.prepare(
        'INSERT INTO queue_items (name, reason, position) VALUES (?, ?, ?)'
      ).run(name, reason, position);

      // 삽입된 항목 조회
      item = db.prepare('SELECT * FROM queue_items WHERE id = ?').get(insertResult.lastInsertRowid) as QueueItem;

      return item;
    });

    const item = insertItem(trimmedName, trimmedReason, direction);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('POST /api/queue error:', error);
    return NextResponse.json(
      { error: '항목 추가에 실패했습니다' },
      { status: 500 }
    );
  }
}
