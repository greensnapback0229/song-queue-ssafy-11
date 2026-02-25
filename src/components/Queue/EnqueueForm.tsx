'use client';

import { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

interface EnqueueFormProps {
  onAdd: () => void;
}

export default function EnqueueForm({ onAdd }: EnqueueFormProps) {
  const { isAdmin, password } = useAdmin();
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [direction, setDirection] = useState<'front' | 'back'>('back');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Show message if not admin
  if (!isAdmin) {
    return (
      <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-[24px] p-4 sm:p-6 border border-gray-100 dark:border-white/5 flex flex-row items-center gap-4 transition-all duration-300">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-toss-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-gray-500 dark:text-gray-300 text-sm font-bold">
            관리자만 큐에 항목을 추가할 수 있습니다.
          </p>
          <p className="text-gray-400 dark:text-gray-400 text-xs">
            우측 상단의 "관리자" 버튼을 클릭하여 로그인한 뒤 노래를 부를 사람을 추가해보세요.
          </p>
        </div>
      </div>
    );
  }

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
          'x-admin-password': password,
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
    <div className="bg-white dark:bg-gray-900 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-7 border border-gray-100 dark:border-white/5 transition-colors duration-300">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 font-title">
        <span className="w-1.5 h-6 bg-toss-blue rounded-full" />
        새 항목 추가
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-bold text-gray-500 dark:text-gray-400 ml-1 transition-colors duration-300">
            이름
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-toss-blue focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm"
            placeholder="예: 김싸피"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reason" className="block text-sm font-bold text-gray-500 dark:text-gray-400 ml-1 transition-colors duration-300">
            벌칙 사유
          </label>
          <input
            type="text"
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-toss-blue focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm"
            placeholder="예: 9시 1분 지각"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 ml-1 transition-colors duration-300">
            삽입 위치
          </label>
          <div className="flex gap-2 p-1.5 bg-gray-50 dark:bg-white/5 rounded-[18px] transition-colors duration-300">
            <button
              type="button"
              onClick={() => setDirection('back')}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                direction === 'back'
                  ? 'bg-white dark:bg-gray-800 text-toss-blue shadow-sm ring-1 ring-gray-100 dark:ring-white/10'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
              disabled={isLoading}
            >
              뒤에 추가
            </button>
            <button
              type="button"
              onClick={() => setDirection('front')}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                direction === 'front'
                  ? 'bg-white dark:bg-gray-800 text-toss-blue shadow-sm ring-1 ring-gray-100 dark:ring-white/10'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
              disabled={isLoading}
            >
              앞에 추가
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 px-5 py-3 rounded-2xl text-sm font-semibold animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-toss-blue hover:bg-toss-blue-hover text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isLoading ? '추가 중...' : '큐에 추가하기'}
        </button>
      </form>
    </div>
  );
}
