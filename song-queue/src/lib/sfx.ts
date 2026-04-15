'use client';

const CLAP_SOURCE = '/sfx/clap1.mp3';

const CLAP_POOL_SIZE = 3;

let clapPool: HTMLAudioElement[][] | null = null;
let sfxUnlocked = false;

function ensureClapPool(): HTMLAudioElement[][] {
  if (clapPool) return clapPool;

  if (typeof window === 'undefined') {
    clapPool = [];
    return clapPool;
  }

  clapPool = [CLAP_SOURCE].map((src) => {
    const audios = Array.from({ length: CLAP_POOL_SIZE }, () => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      return audio;
    });
    audios.forEach((a) => {
      try {
        a.load();
      } catch {
        // ignore
      }
    });
    return audios;
  });

  return clapPool;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pickPlayableAudio(pool: HTMLAudioElement[]) {
  for (const audio of pool) {
    if (audio.paused || audio.ended) return audio;
  }
  return pool[0] ?? null;
}

export function unlockSfx() {
  sfxUnlocked = true;

  const pool = ensureClapPool();
  const first = pool[0]?.[0];
  if (!first) return;

  // Some browsers require an actual play() call in a user gesture to "unlock" audio.
  // We do a silent play/pause cycle to prime decoding and bypass autoplay restrictions.
  try {
    const prevMuted = first.muted;
    const prevVolume = first.volume;
    first.muted = true;
    first.volume = 0;
    first.currentTime = 0;
    const p = first.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        first.pause();
        first.currentTime = 0;
        first.muted = prevMuted;
        first.volume = prevVolume;
      }).catch(() => {
        first.muted = prevMuted;
        first.volume = prevVolume;
      });
    } else {
      first.pause();
      first.currentTime = 0;
      first.muted = prevMuted;
      first.volume = prevVolume;
    }
  } catch {
    // ignore
  }
}

export function playClapSfx() {
  const pool = ensureClapPool();
  if (pool.length === 0) return;

  // Autoplay 정책 때문에 첫 사용자 액션 이전에는 막힐 수 있습니다.
  if (!sfxUnlocked) unlockSfx();

  const samplePool = pool[0] ?? [];
  const audio = pickPlayableAudio(samplePool);
  if (!audio) return;

  // 너무 기계적으로 들리지 않게 미세 랜덤성 부여
  const baseVolume = 0.7;
  const volumeJitter = 0.08;
  const volume = clamp(baseVolume + randomBetween(-volumeJitter, volumeJitter), 0, 1);

  const baseRate = 1.0;
  const rateJitter = 0.04;
  const rate = clamp(baseRate + randomBetween(-rateJitter, rateJitter), 0.85, 1.15);

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    audio.playbackRate = rate;
    void audio.play().catch(() => {});
  } catch {
    // ignore
  }
}
