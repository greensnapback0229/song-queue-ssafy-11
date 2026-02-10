'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QueueItem } from '@/types';
import EnqueueForm from '@/components/Queue/EnqueueForm';
import QueueList from '@/components/Queue/QueueList';
import DequeueModal from '@/components/Queue/DequeueModal';

export default function Home() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

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
    try {
      const response = await fetch(`/api/queue/${id}`, {
        method: 'DELETE',
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">노래 큐</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleStartSinging}
              disabled={items.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              노래 시작
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-600">현재 대기</p>
              <p className="text-3xl font-bold text-purple-600">
                {items.length}명
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 폼 */}
      <EnqueueForm onAdd={fetchQueue} />

      {/* 리스트 */}
      <QueueList items={items} onDelete={handleDelete} />

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
