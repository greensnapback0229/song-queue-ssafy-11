'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { MEMBERS } from '@/constants/members';

interface RandomPickerProps {
  onAdd: () => void;
  ws: WebSocket | null;
}

type Phase = 'idle' | 'spinning' | 'result';

export default function RandomPicker({ onAdd, ws }: RandomPickerProps) {
  const { isAdmin, password } = useAdmin();
  const [phase, setPhase] = useState<Phase>('idle');
  const [displayName, setDisplayName] = useState('');
  const [winner, setWinner] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const getRandomMember = () => {
    return MEMBERS[Math.floor(Math.random() * MEMBERS.length)];
  };

  // 룰렛 애니메이션 실행 (winner를 인자로 받아 결정적으로 동작)
  const runAnimation = useCallback((chosenWinner: string) => {
    setError('');
    setPhase('spinning');
    setWinner(chosenWinner);

    let elapsed = 0;
    const totalDuration = 2500;

    const tick = () => {
      elapsed += 50;

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
        setDisplayName(chosenWinner);
        setPhase('result');

        // 일반 사용자: 30초 타임아웃으로 자동 닫힘 (관리자가 닫지 않을 경우 대비)
        autoCloseRef.current = setTimeout(() => {
          setPhase((current) => {
            if (current === 'result') return 'idle';
            return current;
          });
        }, 30000);
        return;
      }

      // 랜덤 이름 표시
      let randomName = getRandomMember();
      if (MEMBERS.length > 1) {
        // 마지막 몇 틱은 당첨자 근처 이름을 보여주기
        if (progress > 0.9) {
          const winnerIdx = MEMBERS.indexOf(chosenWinner);
          const offset = Math.floor(Math.random() * 3) - 1;
          const idx = (winnerIdx + offset + MEMBERS.length) % MEMBERS.length;
          randomName = MEMBERS[idx];
        }
      }
      setDisplayName(randomName);

      timerRef.current = setTimeout(tick, interval);
    };

    tick();
  }, []);

  // WebSocket 메시지 수신 핸들러 - ws가 바뀔 때마다 재등록
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'picker_start' && data.winner) {
          cleanup();
          runAnimation(data.winner);
        } else if (data.type === 'picker_end') {
          cleanup();
          setPhase('idle');
          setWinner('');
          setDisplayName('');
          setError('');
          onAdd(); // 큐 새로고침
        } else if (data.type === 'picker_error') {
          setError(data.message || '오류가 발생했습니다.');
          setPhase('idle');
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, cleanup, runAnimation, onAdd]);

  // 관리자: 뽑기 시작 → WebSocket으로 broadcast
  const handleStartPicker = useCallback(() => {
    const chosen = getRandomMember();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'picker_start',
        winner: chosen,
        password,
      }));
    } else {
      // WebSocket 미연결 시 로컬에서만 동작 (graceful degradation)
      runAnimation(chosen);
    }
  }, [password, ws, runAnimation]);

  // 관리자: 큐에 추가
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

      // 성공 → picker_end broadcast + 큐 새로고침
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'picker_end', password }));
      } else {
        cleanup();
        setPhase('idle');
        setWinner('');
        setDisplayName('');
        onAdd();
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  // 관리자: 다시 뽑기
  const handleRetry = () => {
    cleanup();
    setWinner('');
    setError('');
    handleStartPicker();
  };

  // 관리자: 닫기
  const handleClose = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'picker_end', password }));
    } else {
      cleanup();
      setPhase('idle');
      setWinner('');
      setDisplayName('');
      setError('');
    }
  };

  if (MEMBERS.length === 0) return null;

  return (
    <>
      {/* 랜덤 뽑기 버튼 - 관리자만 */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <button
            onClick={handleStartPicker}
            disabled={phase !== 'idle'}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-lg"
          >
            🎲 랜덤 뽑기
          </button>
        </div>
      )}

      {/* 룰렛 애니메이션 오버레이 - 모든 사용자 */}
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

      {/* 당첨 결과 모달 - 모든 사용자 */}
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

            {/* 관리자: 액션 버튼 */}
            {isAdmin ? (
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
            ) : (
              /* 일반 사용자: 안내 문구 */
              <p className="text-gray-400 text-sm animate-pulse">
                관리자가 결과를 처리 중입니다...
              </p>
            )}
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
