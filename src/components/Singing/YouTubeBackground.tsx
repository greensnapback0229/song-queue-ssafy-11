'use client';

interface YouTubeBackgroundProps {
  videoId: string;
}

export default function YouTubeBackground({ videoId }: YouTubeBackgroundProps) {
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&loop=1&playlist=${videoId}&rel=0&modestbranding=1&showinfo=0&mute=0`;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <iframe
        src={src}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="absolute border-0"
        style={{
          top: '50%',
          left: '50%',
          width: 'max(177.78vh, 100vw)',
          height: 'max(56.25vw, 100vh)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
