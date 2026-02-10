'use client';

import { QueueItem } from '@/types';

interface QueueListProps {
  items: QueueItem[];
  onDelete: (id: number) => void;
}

export default function QueueList({ items, onDelete }: QueueListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-gray-400 mb-3">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">큐가 비어있습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-100">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="group relative p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* 순서 번호 */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-700">
                    {index + 1}
                  </span>
                </div>
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {item.name}
                  </h3>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm">
                      NEXT
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">
                  {item.reason}
                </p>
              </div>

              {/* 삭제 버튼 */}
              <button
                onClick={() => onDelete(item.id)}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all flex items-center justify-center"
                aria-label="삭제"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
