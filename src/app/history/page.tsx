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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">노래 내역</h1>
          {!isLoading && (
            <p className="text-gray-600">총 {items.length}곡</p>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">로딩 중...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-gray-500 text-lg">아직 노래 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{formatDate(item.completed_at)}</span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-lg text-purple-600 mb-2">{item.song_title}</p>
                <p className="text-gray-600">{item.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
