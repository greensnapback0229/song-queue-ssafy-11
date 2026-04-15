import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import type { YouTubeSearchResult } from '@/types';

type YouTubeSearchApiResponse = {
  items?: YouTubeSearchItem[];
};

type YouTubeSearchItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium?: { url: string };
      default?: { url: string };
    };
  };
};

export async function GET(request: NextRequest) {
  const password = request.headers.get('x-admin-password');
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim() === '') {
    return NextResponse.json({ error: '검색어를 입력해주세요' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API 키가 설정되지 않았습니다' }, { status: 500 });
  }

  try {
    const keyword = request.nextUrl.searchParams.get('keyword') || '금영노래방';
    const searchQuery = `${q.trim()} ${keyword}`;
    // 유튜브 검색 결과에서 TJ 관련 영상 제외 (ex: "TJ노래방", "TJ Karaoke" 등)
    const excludeTjRegex = /tj/i;
    // 필터로 인해 결과가 줄어들 수 있어, 기본 maxResults 보다 더 가져옵니다.
    const maxResultsToFetch = 10;

    const fetchResults = async (maxResults: number): Promise<YouTubeSearchResult[] | null> => {
      const params = new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        maxResults: String(maxResults),
        key: apiKey,
      });

      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!res.ok) {
        const error = await res.json();
        console.error('YouTube API error:', error);
        return null;
      }

      const data = (await res.json()) as YouTubeSearchApiResponse;
      return (data.items || []).map((item) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl:
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url ??
          '',
      }));
    };

    let results = await fetchResults(maxResultsToFetch);
    if (!results) {
      return NextResponse.json({ error: 'YouTube 검색에 실패했습니다' }, { status: 502 });
    }

    results = results.filter((r) => {
      const haystack = `${r.title ?? ''} ${r.channelTitle ?? ''}`;
      return !excludeTjRegex.test(haystack);
    });

    results = results.slice(0, 5);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json({ error: 'YouTube 검색 중 오류가 발생했습니다' }, { status: 500 });
  }
}
