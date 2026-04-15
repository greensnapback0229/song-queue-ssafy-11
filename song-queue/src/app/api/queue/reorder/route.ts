import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Verify admin password
  const password = request.headers.get('x-admin-password');
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 401 });
  }

  try {
    const { itemIds } = await request.json();

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { error: '잘못된 데이터 형식입니다' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 트랜잭션으로 위치 순서 업데이트
    const updatePositions = db.transaction((ids: number[]) => {
      const stmt = db.prepare('UPDATE queue_items SET position = ? WHERE id = ?');
      
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
    });

    updatePositions(itemIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/queue/reorder error:', error);
    return NextResponse.json(
      { error: '위치 변경에 실패했습니다' },
      { status: 500 }
    );
  }
}
