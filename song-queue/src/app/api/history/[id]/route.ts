import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const password = request.headers.get('x-admin-password');
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 401 });
  }

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
    const result = db.prepare('DELETE FROM song_history WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: '항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/history/[id] error:', error);
    return NextResponse.json(
      { error: '내역 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}
