'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
  muted?: boolean;
}

export type YouTubeBackgroundHandle = {
  isReady: () => boolean;
  getCurrentTime: () => number | null;
  getDuration: () => number | null;
  getPlayerState: () => number | null;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  play: () => void;
  pause: () => void;
};

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  destroy: () => void;
};

type YTPlayerOptions = {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: () => void;
  };
};

type YTNamespace = {
  Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youTubeIframeApiPromise: Promise<void> | null = null;

function loadYouTubeIframeAPI(): Promise<void> {
  if (youTubeIframeApiPromise) return youTubeIframeApiPromise;

  youTubeIframeApiPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (window.YT?.Player) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      resolve();
    };

    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
    document.head.appendChild(script);
  });

  return youTubeIframeApiPromise;
}

const YouTubeBackground = forwardRef<YouTubeBackgroundHandle, YouTubeBackgroundProps>(function YouTubeBackground(
  { videoId, muted = true },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const normalizedVideoId = useMemo(() => normalizeYouTubeVideoId(videoId), [videoId]);
  const readyRef = useRef(false);
  const mutedRef = useRef(muted);

  const origin = typeof window !== 'undefined' ? window.location.origin : null;

  useImperativeHandle(ref, () => ({
    isReady: () => readyRef.current && !!playerRef.current,
    getCurrentTime: () => {
      if (!playerRef.current) return null;
      try {
        return playerRef.current.getCurrentTime();
      } catch {
        return null;
      }
    },
    getDuration: () => {
      if (!playerRef.current) return null;
      try {
        return playerRef.current.getDuration();
      } catch {
        return null;
      }
    },
    getPlayerState: () => {
      if (!playerRef.current) return null;
      try {
        return playerRef.current.getPlayerState();
      } catch {
        return null;
      }
    },
    seekTo: (seconds: number) => {
      if (!playerRef.current) return;
      const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      playerRef.current.seekTo(safeSeconds, true);
    },
    seekBy: (deltaSeconds: number) => {
      if (!playerRef.current) return;
      const current = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      const next = current + deltaSeconds;
      const clamped = Number.isFinite(duration) && duration > 0 ? Math.min(Math.max(0, next), duration) : Math.max(0, next);
      playerRef.current.seekTo(clamped, true);
    },
    play: () => {
      if (!playerRef.current) return;
      try {
        playerRef.current.playVideo();
      } catch {
        // ignore
      }
    },
    pause: () => {
      if (!playerRef.current) return;
      try {
        playerRef.current.pauseVideo();
      } catch {
        // ignore
      }
    },
  }), []);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    if (!normalizedVideoId) return;
    let cancelled = false;
    readyRef.current = false;

    loadYouTubeIframeAPI()
      .then(() => {
        if (cancelled) return;
        if (!containerRef.current) return;
        if (!window.YT?.Player) return;

        const playerVars: Record<string, string | number> = {
          autoplay: 1,
          mute: 1,
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          loop: 1,
          playlist: normalizedVideoId,
          rel: 0,
          modestbranding: 1,
        };
        if (origin) playerVars.origin = origin;

        playerRef.current?.destroy();
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: normalizedVideoId,
          playerVars: {
            ...playerVars,
          },
          events: {
            onReady: () => {
              readyRef.current = true;
              try {
                if (mutedRef.current) {
                  playerRef.current?.mute();
                  return;
                }
                playerRef.current?.unMute();
                playerRef.current?.setVolume(100);
                playerRef.current?.playVideo();
              } catch {
                // ignore
              }
            },
          },
        });
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
      readyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [normalizedVideoId, origin]);

  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    // 유저가 사운드 버튼을 누른 뒤에만 보통 unMute/playVideo가 허용됨(자동재생 정책)
    try {
      if (muted) {
        playerRef.current.mute();
        return;
      }
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      playerRef.current.playVideo();
    } catch {
      // ignore
    }
  }, [muted]);

  if (!normalizedVideoId) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black z-0 pointer-events-none">
      <div
        ref={containerRef}
        className="border-0 w-full h-full aspect-video max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] opacity-95 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
        aria-hidden="true"
      />
    </div>
  );
});

export default YouTubeBackground;

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
