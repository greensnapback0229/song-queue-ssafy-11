'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
  muted?: boolean;
}

export default function YouTubeBackground({ videoId, muted = true }: YouTubeBackgroundProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const normalizedVideoId = useMemo(() => normalizeYouTubeVideoId(videoId), [videoId]);
  const [loaded, setLoaded] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : null;

  const src = useMemo(() => {
    if (!normalizedVideoId) return null;

    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      playsinline: '1',
      controls: '0',
      disablekb: '1',
      fs: '0',
      iv_load_policy: '3',
      loop: '1',
      playlist: normalizedVideoId,
      rel: '0',
      modestbranding: '1',
      enablejsapi: '1',
    });

    if (origin) params.set('origin', origin);

    return `https://www.youtube.com/embed/${normalizedVideoId}?${params.toString()}`;
  }, [normalizedVideoId, origin]);

  useEffect(() => {
    if (!normalizedVideoId) return;
    if (!loaded) return;
    const playerWindow = iframeRef.current?.contentWindow;
    if (!playerWindow) return;

    const postCommand = (func: string, args: unknown[] = []) => {
      playerWindow.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com');
    };

    // 유저가 사운드 버튼을 누른 뒤에만 보통 unMute/playVideo가 허용됨(자동재생 정책)
    if (muted) {
      postCommand('mute');
      return;
    }

    postCommand('unMute');
    postCommand('setVolume', [100]);
    postCommand('playVideo');
  }, [muted, loaded, normalizedVideoId]);

  if (!src) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black z-0 pointer-events-none">
      <iframe
        src={src}
        ref={iframeRef}
        title="YouTube Background"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="border-0 w-full h-full aspect-video max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] opacity-95"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function normalizeYouTubeVideoId(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  // 이미 videoId(보통 11자)만 들어온 경우
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // URL 형태로 들어온 경우 (watch?v=, youtu.be/, embed/ 등)
  try {
    const url = new URL(trimmed);
    const v = url.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

    // /embed/{id}, /shorts/{id}, youtu.be/{id}
    const pathParts = url.pathname.split('/').filter(Boolean);
    const candidate = pathParts[pathParts.length - 1];
    if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
  } catch {
    // ignore
  }

  // 마지막 fallback: 문자열에서 11자 videoId 패턴 추출
  const match = trimmed.match(/(?:^|[^a-zA-Z0-9_-])([a-zA-Z0-9_-]{11})(?:$|[^a-zA-Z0-9_-])/);
  return match?.[1] ?? null;
}
