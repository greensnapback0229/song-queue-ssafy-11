'use client';

import { useState } from 'react';
import { QueueItem, YouTubeSearchResult } from '@/types';
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
  const [ytResults, setYtResults] = useState<YouTubeSearchResult[]>([]);
  const [ytSearching, setYtSearching] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResult | null>(null);
  const [searchMode, setSearchMode] = useState<'금영노래방' | '가사 MR'>('금영노래방');

  if (!isOpen || !nextPerson) return null;

  const searchYouTube = async (keyword: string) => {
    if (!songTitle.trim()) return;
    setYtSearching(true);
    setYtResults([]);
    setSelectedVideo(null);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(songTitle.trim())}&keyword=${encodeURIComponent(keyword)}`, {
        headers: { 'x-admin-password': password },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'YouTube 검색 실패');
        return;
      }
      const data = await res.json();
      setYtResults(data.results || []);
    } catch {
      alert('YouTube 검색 중 오류가 발생했습니다.');
    } finally {
      setYtSearching(false);
    }
  };

  const handleYouTubeSearch = () => {
    setSearchMode('금영노래방');
    searchYouTube('금영노래방');
  };

  const handleToggleSearch = () => {
    const nextMode = searchMode === '금영노래방' ? '가사 MR' : '금영노래방';
    setSearchMode(nextMode);
    searchYouTube(nextMode);
  };

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
        body: JSON.stringify({
          song_title: songTitle.trim(),
          youtube_video_id: selectedVideo?.videoId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '노래 시작에 실패했습니다.');
      }

      setSongTitle('');
      setYtResults([]);
      setSelectedVideo(null);
      setSearchMode('금영노래방');
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
    setYtResults([]);
    setSelectedVideo(null);
    setSearchMode('금영노래방');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

        <div className="mb-4">
          <label htmlFor="songTitle" className="block text-sm font-medium text-gray-700 mb-2">
            노래 제목
          </label>
          <div className="flex gap-2">
            <input
              id="songTitle"
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="노래 제목을 입력하세요"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleYouTubeSearch();
                }
              }}
            />
            <button
              type="button"
              onClick={handleYouTubeSearch}
              disabled={isLoading || ytSearching || !songTitle.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {ytSearching ? '검색 중...' : 'YouTube 검색'}
            </button>
          </div>
        </div>

        {/* YouTube 검색 결과 */}
        {ytResults.length > 0 && (
          <div className="mb-6 space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-1">반주 영상 선택 (선택사항)</div>
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-800 leading-relaxed">
              <p className="font-bold">노래방 공식 영상은 YouTube에서 임베딩을 허용하지 않습니다.</p>
              <p className="mt-1">금영노래방은 임베딩을 허용합니다. 미리보기로 재생 가능 여부를 확인해주세요.</p>
            </div>
            {ytResults.map((video) => {
              const isSelected = selectedVideo?.videoId === video.videoId;
              return (
                <div key={video.videoId}>
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(isSelected ? null : video)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 text-left transition-colors ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-32 h-20 object-cover rounded flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2" dangerouslySetInnerHTML={{ __html: video.title }} />
                      <div className="text-xs text-gray-500 mt-1">{video.channelTitle}</div>
                    </div>
                    {isSelected ? (
                      <div className="text-purple-600 font-bold text-lg flex-shrink-0">&#10003;</div>
                    ) : (
                      <div className="text-xs text-gray-400 flex-shrink-0">미리보기</div>
                    )}
                  </button>
                  {/* 토글 미리보기 */}
                  {isSelected && (
                    <div className="mt-1 mb-2">
                      <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=0&controls=1`}
                          allow="encrypted-media"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full border-0"
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        재생이 안 되면 다른 영상을 선택하세요.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={handleToggleSearch}
              disabled={ytSearching}
              className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ytSearching ? '검색 중...' : searchMode === '금영노래방' ? '다른 검색결과 보기 (가사 MR)' : '금영노래방 검색결과 보기'}
            </button>
          </div>
        )}

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
