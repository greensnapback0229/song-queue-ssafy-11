'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

interface SongHistory {
  id: number;
  name: string;
  reason: string;
  song_title: string;
  completed_at: string;
}

export default function History() {
  const { isAdmin, password } = useAdmin();
  const [items, setItems] = useState<SongHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    if (!confirm('정말 이 내역을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password,
        },
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      await fetchHistory();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'Z');
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground font-title transition-colors duration-300">노래 내역</h1>
            {!isLoading && (
              <p className="text-gray-400 dark:text-gray-400 font-bold ml-1 transition-colors duration-300">총 {items.length}곡의 기록이 있습니다</p>
            )}
          </div>
          <div className="px-6 py-3 bg-toss-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-title font-bold text-sm transition-all hover:scale-105">
            노래 내역 기록
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-20 text-center border border-gray-50 dark:border-white/5 transition-colors duration-300">
            <div className="w-12 h-12 border-4 border-toss-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 dark:text-gray-400 font-bold">내역을 불러오는 중...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-20 text-center border border-gray-50 dark:border-white/5 transition-colors duration-300">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-700">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-gray-400 dark:text-gray-400 font-bold text-xl transition-colors duration-300">아직 노래 내역이 없습니다</p>
            <p className="text-gray-300 dark:text-gray-400 mt-2 transition-colors duration-300">첫 번째 노래의 주인공이 되어보세요!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-white dark:bg-gray-900 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 sm:p-8 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-toss-blue bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md uppercase tracking-wider">Completed</span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{formatDate(item.completed_at)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">{item.name}</h3>
                    <p className="text-2xl font-black text-gray-900 dark:text-white font-title tracking-tight transition-colors duration-300">{item.song_title}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl inline-block transition-colors duration-300">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">{item.reason}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-4">
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center"
                      title="내역 삭제"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-gray-50 dark:group-hover:bg-gray-700 transition-all duration-300 overflow-hidden border border-gray-100 dark:border-white/10 text-xl">
                    🎤
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
