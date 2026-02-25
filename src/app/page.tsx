'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QueueItem } from '@/types';
import EnqueueForm from '@/components/Queue/EnqueueForm';
import QueueList from '@/components/Queue/QueueList';
import DequeueModal from '@/components/Queue/DequeueModal';
import RandomPicker from '@/components/Queue/RandomPicker';
import { useAdmin } from '@/context/AdminContext';

export default function Home() {
  const { isAdmin, password } = useAdmin();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const [ws, setWs] = useState<WebSocket | null>(null);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/queue');
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('큐 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) {
      alert('관리자만 삭제할 수 있습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/queue/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password,
        },
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      await fetchQueue();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // WebSocket 연결 (랜덤 뽑기 브로드캐스트용)
  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let currentWs: WebSocket | null = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

      socket.onopen = () => {
        if (isMounted) {
          currentWs = socket;
          setWs(socket);
        }
      };

      socket.onclose = () => {
        if (isMounted) {
          currentWs = null;
          setWs(null);
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (currentWs) {
        currentWs.close();
      }
      setWs(null);
    };
  }, []);

  // 노래 세션 감지 - 3초마다 폴링
  useEffect(() => {
    const checkSinging = async () => {
      try {
        const res = await fetch('/api/singing/current');
        const data = await res.json();
        if (data.session) {
          router.push('/singing');
        }
      } catch {
        // ignore
      }
    };
    checkSinging();
    const interval = setInterval(checkSinging, 3000);
    return () => clearInterval(interval);
  }, [router]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
        <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-20 text-center border border-gray-50 dark:border-white/5 transition-colors duration-300">
          <div className="w-12 h-12 border-4 border-toss-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 dark:text-gray-500 font-bold">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const handleReorder = async (newItems: QueueItem[]) => {
    // Optimistic update
    const previousItems = [...items];
    setItems(newItems);

    try {
      const response = await fetch('/api/queue/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          itemIds: newItems.map(item => item.id)
        }),
      });

      if (!response.ok) {
        throw new Error('위치 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('순서 변경 중 오류:', error);
      setItems(previousItems); // Rollback
      alert('순서 변경 중 오류가 발생했습니다.');
    }
  };

  const handleStartSinging = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSingingStart = async () => {
    setIsModalOpen(false);
    await fetchQueue();
    router.push('/singing');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero / Hero Header */}
      <section className="bg-white dark:bg-gray-900 rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-8 sm:p-10 border border-gray-50 dark:border-white/5 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-[24px] flex items-center justify-center mb-2 shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden border border-gray-50 dark:border-white/10 text-3xl transition-all duration-300 hover:scale-105">
              🎤
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight font-title transition-colors duration-300">
              오늘의 <span className="text-toss-blue">노래 주인공</span>은<br />
              누구일까요?
            </h3>
            <p className="text-gray-400 dark:text-gray-400 font-medium text-base leading-relaxed transition-colors duration-300">
              노래를 부를 사람을 관리하고 <br className="sm:hidden" /> 
              실시간으로 소통해보세요.
            </p>
          </div>
          
          <div className="flex items-center gap-6 self-start sm:self-center">
             <div className="text-left py-2">
              <p className="text-xs font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-1 ml-0.5 transition-colors duration-300">대기 인원</p>
              <p className="text-4xl font-black text-toss-blue tabular-nums font-title transition-colors duration-300">
                {items.length}
              </p>
            </div>
            
            <button
              onClick={handleStartSinging}
              disabled={items.length === 0 || !isAdmin}
              className="group flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 bg-toss-blue hover:bg-toss-blue-hover text-white rounded-[32px] font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-90 disabled:opacity-20 disabled:grayscale disabled:shadow-none"
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span className="text-xs sm:text-sm font-black">시작하기</span>
            </button>
          </div>
        </div>
      </section>

      {/* 비관리자 안내 문구 - 상단에 약하게 표시 */}
      {!isAdmin && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
          <EnqueueForm onAdd={fetchQueue} />
        </div>
      )}

      <div className="space-y-10">
        {/* 랜덤 뽑기 컴포넌트 - 상단에 배치 (관리자에게 더 잘 보이게) */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000 delay-200">
          <RandomPicker onAdd={fetchQueue} ws={ws} />
        </div>

        {/* 대기 목록 - 메인 영역 (가운데) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2 transition-colors duration-300">
              <span className="w-1.5 h-6 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-300" />
              대기 목록
            </h3>

          </div>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <QueueList 
              items={items} 
              onDelete={handleDelete} 
              onReorder={handleReorder}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        {/* 추가 폼 컴포넌트 - 관리자일 때만 하단 보완 */}
        {isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
            <EnqueueForm onAdd={fetchQueue} />
          </div>
        )}
      </div>

      {/* Dequeue Modal */}
      <DequeueModal
        isOpen={isModalOpen}
        nextPerson={items.length > 0 ? items[0] : null}
        onClose={handleModalClose}
        onStart={handleSingingStart}
      />
    </div>
  );
}
