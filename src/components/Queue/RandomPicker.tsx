'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { MEMBERS } from '@/constants/members';

interface RandomPickerProps {
  onAdd: () => void;
}

type Phase = 'idle' | 'spinning' | 'result';

export default function RandomPicker({ onAdd }: RandomPickerProps) {
  const { isAdmin, password } = useAdmin();
  const [phase, setPhase] = useState<Phase>('idle');
  const [displayName, setDisplayName] = useState('');
  const [winner, setWinner] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const getRandomMember = () => {
    return MEMBERS[Math.floor(Math.random() * MEMBERS.length)];
  };

  const startSpin = useCallback(() => {
    setError('');
    setPhase('spinning');

    const chosen = getRandomMember();
    let elapsed = 0;
    const totalDuration = 2500;

    const tick = () => {
      elapsed += 50;

      // 점점 느려지는 간격 계산
      const progress = elapsed / totalDuration;
      let interval: number;
      if (progress < 0.4) {
        interval = 50;
      } else if (progress < 0.7) {
        interval = 100;
      } else if (progress < 0.85) {
        interval = 200;
      } else if (progress < 0.95) {
        interval = 350;
      } else {
        interval = 500;
      }

      if (elapsed >= totalDuration) {
        // 최종 당첨자 표시
        setDisplayName(chosen);
        setWinner(chosen);
        setPhase('result');
        return;
      }

      // 랜덤 이름 표시 (당첨자와 다른 이름 우선)
      let randomName = getRandomMember();
      if (MEMBERS.length > 1) {
        while (randomName === displayName) {
          randomName = getRandomMember();
        }
      }
      setDisplayName(randomName);

      timerRef.current = setTimeout(tick, interval);
    };

    tick();
  }, [displayName, cleanup]);

  const handleAddToQueue = async () => {
    if (!winner) return;

    setIsAdding(true);
    setError('');

    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          name: winner,
          reason: '랜덤 뽑기 당첨',
          direction: 'front',
        }),
      });

      if (response.status === 401) {
        setError('관리자 인증이 필요합니다.');
        return;
      }

      if (!response.ok) {
        setError('추가에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // 성공 → 모달 닫기 + 큐 새로고침
      setPhase('idle');
      setWinner('');
      setDisplayName('');
      onAdd();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRetry = () => {
    cleanup();
    setWinner('');
    setError('');
    startSpin();
  };

  const handleClose = () => {
    cleanup();
    setPhase('idle');
    setWinner('');
    setDisplayName('');
    setError('');
  };

  if (!isAdmin) return null;
  if (MEMBERS.length === 0) return null;

  return (
    <>
      {/* 랜덤 뽑기 버튼 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={startSpin}
          disabled={phase !== 'idle'}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-lg"
        >
          🎲 랜덤 뽑기
        </button>
      </div>

      {/* 룰렛 애니메이션 오버레이 */}
      {phase === 'spinning' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center">
            <p className="text-white text-lg mb-4 animate-pulse">두구두구두구...</p>
            <div className="bg-white rounded-2xl shadow-2xl px-16 py-12 min-w-[320px]">
              <p className="text-5xl font-black text-purple-600 transition-all">
                {displayName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 당첨 결과 모달 */}
      {phase === 'result' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-[scaleIn_0.3s_ease-out]"
          >
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-600 text-lg mb-2">당첨!</p>
            <p className="text-5xl font-black text-purple-600 mb-8">
              {winner}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleAddToQueue}
                disabled={isAdding}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {isAdding ? '추가 중...' : '큐에 추가'}
              </button>
              <button
                onClick={handleRetry}
                disabled={isAdding}
                className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                다시 뽑기
              </button>
              <button
                onClick={handleClose}
                disabled={isAdding}
                className="w-full text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
