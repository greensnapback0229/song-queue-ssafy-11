'use client';

import { useState } from 'react';

interface EnqueueFormProps {
  onAdd: () => void;
}

export default function EnqueueForm({ onAdd }: EnqueueFormProps) {
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [direction, setDirection] = useState<'front' | 'back'>('back');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !reason.trim()) {
      setError('이름과 벌칙 사유를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          reason: reason.trim(),
          direction,
        }),
      });

      if (!response.ok) {
        throw new Error('추가에 실패했습니다.');
      }

      // 성공 시 입력 초기화
      setName('');
      setReason('');
      setDirection('back');
      onAdd();
    } catch (err) {
      setError(err instanceof Error ? err.message : '추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">새 항목 추가</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
            placeholder="이름을 입력하세요"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            벌칙 사유
          </label>
          <input
            type="text"
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
            placeholder="벌칙 사유를 입력하세요"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            삽입 위치
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection('back')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                direction === 'back'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isLoading}
            >
              뒤에 추가
            </button>
            <button
              type="button"
              onClick={() => setDirection('front')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                direction === 'front'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isLoading}
            >
              앞에 추가
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {isLoading ? '추가 중...' : '큐에 추가'}
        </button>
      </form>
    </div>
  );
}
