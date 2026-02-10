import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { QueueItem } from '@/types';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID입니다' },
        { status: 400 }
      );
    }

    const db = getDb();

    // 트랜잭션으로 삭제 처리
    const deleteItem = db.transaction((id: number) => {
      // 삭제할 항목 조회
      const item = db.prepare('SELECT * FROM queue_items WHERE id = ?').get(id) as QueueItem | undefined;

      if (!item) {
        return null;
      }

      // 항목 삭제
      db.prepare('DELETE FROM queue_items WHERE id = ?').run(id);

      // 삭제된 항목보다 큰 position들을 -1
      db.prepare('UPDATE queue_items SET position = position - 1 WHERE position > ?').run(item.position);

      return true;
    });

    const result = deleteItem(id);

    if (result === null) {
      return NextResponse.json(
        { error: '항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/queue/[id] error:', error);
    return NextResponse.json(
      { error: '항목 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}
