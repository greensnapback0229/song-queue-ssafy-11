import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (verifyPassword(password)) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: '비밀번호가 틀렸습니다' }, { status: 401 });
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ success: false, error: '인증 실패' }, { status: 500 });
  }
}
