import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

type YouTubeSearchApiResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string };
  }>;
};

const KY_TITLE_REGEX = /(금영|\bky\b)/i;

async function findFallbackYouTubeVideoId(songTitle: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const baseParams = {
      part: 'snippet',
      type: 'video',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      key: apiKey,
    } as const;

    const fetchResults = async (q: string, maxResults: number) => {
      const params = new URLSearchParams({
        ...baseParams,
        q,
        maxResults: String(maxResults),
      });

      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
      if (!res.ok) return null;

      const data = (await res.json()) as YouTubeSearchApiResponse;
      return (data.items || [])
        .map((item) => ({
          videoId: item.id?.videoId,
          title: item.snippet?.title || '',
        }))
        .filter(
          (r): r is { videoId: string; title: string } =>
            typeof r.videoId === 'string' && r.videoId.trim().length > 0
        );
    };

    // 1) "검색 안 하고 시작" 시: 일단 노래방 관련 상단 결과를 넓게 가져온 뒤,
    //    제목에 "금영" 또는 "KY" 포함한 첫 결과를 선택
    const broadResults = await fetchResults(`${songTitle.trim()} 노래방`, 10);
    const kyCandidate = broadResults?.find((r) => KY_TITLE_REGEX.test(r.title))?.videoId?.trim();
    if (kyCandidate) return kyCandidate;

    // 2) 그래도 없으면 "금영노래방" 쿼리로 재시도 (최상단 결과)
    const kyQueryResults = await fetchResults(`${songTitle.trim()} 금영노래방`, 5);
    const fallback = kyQueryResults?.[0]?.videoId?.trim();
    return fallback || null;
  } catch {
    return null;
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
    const { song_title, youtube_video_id } = body;

    // Validate song_title
    if (!song_title || song_title.trim() === '') {
      return NextResponse.json(
        { error: '노래 제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    const db = getDb();

    const resolvedYouTubeVideoId =
      typeof youtube_video_id === 'string' && youtube_video_id.trim()
        ? youtube_video_id.trim()
        : await findFallbackYouTubeVideoId(song_title);

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
        'INSERT INTO singing_session (name, reason, song_title, youtube_video_id) VALUES (?, ?, ?, ?)'
      ).run(nextItem.name, nextItem.reason, song_title.trim(), resolvedYouTubeVideoId || null);

      // Get the newly created session
      const session = db.prepare(
        'SELECT id, name, reason, song_title, started_at, youtube_video_id FROM singing_session WHERE id = ?'
      ).get(insertResult.lastInsertRowid) as {
        id: number;
        name: string;
        reason: string;
        song_title: string;
        started_at: string;
        youtube_video_id: string | null;
      };

      return session;
    })();

    return NextResponse.json({ session: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === 'ALREADY_SINGING') {
      return NextResponse.json(
        { error: '이미 노래 중입니다' },
        { status: 409 }
      );
    }
    if (message === 'QUEUE_EMPTY') {
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
