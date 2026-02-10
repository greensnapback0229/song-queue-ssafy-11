'use client';

import { useState } from 'react';
import { QueueItem } from '@/types';
import { useAdmin } from '@/context/AdminContext';

interface DequeueModalProps {
  isOpen: boolean;
  nextPerson: QueueItem | null;
  onClose: () => void;
  onStart: () => void;
}

export default function DequeueModal({
  isOpen,
  nextPerson,
  onClose,
  onStart,
}: DequeueModalProps) {
  const { password } = useAdmin();
  const [songTitle, setSongTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !nextPerson) return null;

  const handleStart = async () => {
    if (!songTitle.trim()) {
      alert('노래 제목을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/singing/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ song_title: songTitle.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '노래 시작에 실패했습니다.');
      }

      setSongTitle('');
      onStart();
    } catch (error: any) {
      console.error('노래 시작 실패:', error);
      alert(error.message || '노래 시작에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSongTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">노래 시작</h2>

        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">다음 순서</span>
            <span className="text-lg font-bold text-purple-600">
              {nextPerson.name}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">벌칙 사유:</span> {nextPerson.reason}
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="songTitle" className="block text-sm font-medium text-gray-700 mb-2">
            노래 제목
          </label>
          <input
            id="songTitle"
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="노래 제목을 입력하세요"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleStart}
            disabled={isLoading || !songTitle.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '처리 중...' : '노래 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
