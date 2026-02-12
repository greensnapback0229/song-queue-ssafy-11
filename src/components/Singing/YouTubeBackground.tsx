'use client';

import { useEffect, useRef, useState } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export default function YouTubeBackground({ videoId }: YouTubeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const createPlayer = () => {
      if (!isMounted || !containerRef.current) return;

      // 플레이어 div 생성
      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-bg-player';
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player('yt-bg-player', {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          loop: 1,
          modestbranding: 1,
          playlist: videoId,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
          },
          onError: () => {
            if (isMounted) setHasError(true);
          },
        },
      });
    };

    // YouTube IFrame API 로드
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'yt-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  if (hasError) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        ref={containerRef}
        className="absolute"
        style={{
          // 16:9 비율로 viewport 완전 커버
          top: '50%',
          left: '50%',
          width: 'max(177.78vh, 100vw)',
          height: 'max(56.25vw, 100vh)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <style jsx>{`
        div :global(iframe) {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
