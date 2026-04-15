'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { MEMBERS } from '@/constants/members';
import { toast } from 'sonner';

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
      toast.success(`${winner} 님이 큐에 추가되었습니다.`);
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
      toast.error('네트워크 오류가 발생했습니다.');
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
      {/* 관리자 대시보드 - 뽑기 시작 버튼 */}
      {isAdmin && phase === 'idle' && (
        <div className="bg-white dark:bg-gray-900 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 border border-gray-100 dark:border-white/5 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
              <span className="text-2xl">🎲</span>
              랜덤 뽑기
            </h3>
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-toss-blue text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors duration-300">Admin Only</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed font-medium transition-colors duration-300">
            큐에 추가할 사람을 무작위로 결정합니다.<br />
            실행 시 모든 참여자에게 화면이 공유됩니다.
          </p>
          <button
            onClick={handleStartPicker}
            className="w-full py-4 bg-gray-900 dark:bg-white dark:text-black hover:bg-black dark:hover:bg-gray-200 text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 dark:shadow-none transition-all duration-300 active:scale-[0.98]"
          >
            뽑기 시작하기
          </button>
        </div>
      )}

      {/* 룰렛 애니메이션 오버레이 - 모든 사용자 */}
      {phase === 'spinning' && (
        <div className="fixed inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-500 transition-colors duration-500">
          <div className="text-center space-y-8 max-w-sm w-full px-6">
            <div className="relative">
              <div className="absolute inset-0 bg-toss-blue/20 blur-3xl rounded-full" />
              <div className="relative bg-white dark:bg-gray-900 rounded-[40px] shadow-[0_20px_60px_rgba(49,130,246,0.15)] py-20 px-8 border border-blue-50 dark:border-white/5 transition-colors duration-500">
                 <p className="text-sm font-black text-toss-blue tracking-[0.2em] mb-6 animate-pulse uppercase">Searching...</p>
                 <div className="h-24 flex items-center justify-center">
                    <p className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight transition-all duration-75 font-title">
                      {displayName}
                    </p>
                 </div>
              </div>
            </div>
            <p className="text-gray-400 dark:text-gray-400 font-bold animate-bounce text-base transition-colors duration-500">
              두구두구두구... 🥁
            </p>
          </div>
        </div>
      )}

      {/* 당첨 결과 모달 - 모든 사용자 */}
      {phase === 'result' && (
        <div className="fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[100] animate-in fade-in zoom-in-95 duration-500 transition-colors duration-500">
          <div
            className="bg-white dark:bg-gray-900 rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.1)] p-10 max-w-md w-full mx-4 text-center border border-gray-100 dark:border-white/10 flex flex-col items-center transition-colors duration-500"
          >
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-5xl mb-8 animate-bounce transition-colors duration-500">
              🎉
            </div>
            
            <div className="space-y-4 mb-10">
              <p className="text-toss-blue font-black tracking-widest uppercase text-xs">Winner Selected</p>
              <h2 className="text-5xl font-bold text-gray-900 dark:text-white tracking-tighter font-title transition-colors duration-500">
                {winner}
              </h2>
            </div>

            {error && (
              <div className="w-full bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 px-6 py-4 rounded-2xl text-sm font-bold mb-6">
                {error}
              </div>
            )}

            {/* 관리자: 액션 버튼 */}
            {isAdmin ? (
              <div className="w-full space-y-3">
                <button
                  onClick={handleAddToQueue}
                  disabled={isAdding}
                  className="w-full bg-toss-blue hover:bg-toss-blue-hover text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isAdding ? '추가 중...' : '바로 큐에 추가하기'}
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button
                    onClick={handleRetry}
                    disabled={isAdding}
                    className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-2xl hover:bg-gray-200 dark:hover:bg-white/20 transition-all active:scale-[0.95]"
                  >
                    다시 뽑기
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={isAdding}
                    className="bg-gray-900 dark:bg-white dark:text-black text-white font-bold py-4 rounded-2xl hover:bg-black dark:hover:bg-gray-200 transition-all active:scale-[0.95]"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              /* 일반 사용자: 안내 문구 */
              <div className="flex flex-col items-center gap-4">
                 <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-toss-blue rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-toss-blue rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-toss-blue rounded-full animate-bounce" />
                 </div>
                 <p className="text-gray-400 dark:text-gray-500 font-bold text-lg italic">
                   관리자가 운명을 결정하고 있습니다...
                 </p>
              </div>
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
