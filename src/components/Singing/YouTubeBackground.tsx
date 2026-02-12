'use client';

interface YouTubeBackgroundProps {
  videoId: string;
}

export default function YouTubeBackground({ videoId }: YouTubeBackgroundProps) {
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&loop=1&playlist=${videoId}&rel=0&modestbranding=1&showinfo=0&mute=0`;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 bg-black">
      <iframe
        src={src}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="border-0 w-full h-full max-w-[177.78vh] max-h-[56.25vw]"
        style={{ aspectRatio: '16/9', pointerEvents: 'none' }}
      />
    </div>
  );
}
