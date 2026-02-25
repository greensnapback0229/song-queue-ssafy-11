'use client';

import { useState } from 'react';
import { QueueItem, YouTubeSearchResult } from '@/types';
import { useAdmin } from '@/context/AdminContext';
import { toast } from 'sonner';

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
        toast.error(data.error || 'YouTube 검색 실패');
        return;
      }
      const data = await res.json();
      setYtResults(data.results || []);
    } catch {
      toast.error('YouTube 검색 중 오류가 발생했습니다.');
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
      toast.error('노래 제목을 입력해주세요.');
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
      toast.success('노래를 시작합니다!');
      onStart();
    } catch (error: any) {
      console.error('노래 시작 실패:', error);
      toast.error(error.message || '노래 시작에 실패했습니다.');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={handleClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] transition-colors duration-300">
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">🎤 노래 시작하기</h2>
          <button 
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 pb-8 overflow-y-auto space-y-8 custom-scrollbar">
          {/* Next Singer Card */}
          <div className="bg-blue-50/50 dark:bg-blue-500/10 rounded-3xl p-6 border border-blue-100/50 dark:border-blue-500/20 flex items-center gap-5 transition-colors duration-300">
            <div className="w-16 h-16 bg-toss-blue rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20 transition-all">
              {nextPerson.name[0]}
            </div>
            <div>
              <p className="text-xs font-black text-toss-blue uppercase tracking-widest mb-1 transition-colors duration-300">Next Singer</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none transition-colors duration-300">{nextPerson.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1.5 transition-colors duration-300">{nextPerson.reason}</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="songTitle" className="block text-sm font-bold text-gray-600 dark:text-gray-400 ml-1 italic transition-colors duration-300">
                무슨 노래를 부를까요?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="songTitle"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="flex-1 px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-toss-blue focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-300 text-gray-900 dark:text-white font-bold text-lg placeholder:text-gray-300 dark:placeholder:text-gray-500 shadow-inner"
                  placeholder="예: 응급실, 가시..."
                />
                <button
                  onClick={handleYouTubeSearch}
                  disabled={ytSearching || !songTitle.trim()}
                  className="px-6 bg-gray-900 dark:bg-white dark:text-black hover:bg-black dark:hover:bg-gray-100 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-20"
                >
                  {ytSearching ? '검색 중' : '검색'}
                </button>
              </div>
            </div>

            {/* YouTube Area */}
            {(ytResults.length > 0 || ytSearching) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-1">
                   <h4 className="text-sm font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest">YouTube 검색 결과</h4>
                   <button 
                    onClick={handleToggleSearch}
                    className="text-xs font-bold text-toss-blue hover:underline underline-offset-4"
                   >
                    {searchMode === '금영노래방' ? '가사 MR로 전환' : '노래방 모드로 전환'}
                   </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {ytResults.map((result) => (
                    <button
                      key={result.videoId}
                      onClick={() => setSelectedVideo(result)}
                      className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 border-2 text-left group ${
                        selectedVideo?.videoId === result.videoId
                          ? 'border-toss-blue bg-blue-50/50 dark:bg-blue-500/10'
                          : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="relative w-32 aspect-video rounded-xl overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                        <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug transition-colors duration-300">
                          {decodeHtmlEntities(result.title)}
                        </p>
                      </div>
                      {selectedVideo?.videoId === result.videoId && (
                        <div className="w-6 h-6 bg-toss-blue rounded-full flex items-center justify-center text-white shrink-0">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 mt-auto">
          <button
            onClick={handleStart}
            disabled={isLoading || !songTitle.trim()}
            className="w-full py-5 bg-toss-blue hover:bg-toss-blue-hover text-white rounded-[24px] font-black text-xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale"
          >
            {isLoading ? '준비 중...' : '노래방 시작!'}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

// Utility to decode HTML entities in YouTube titles
function decodeHtmlEntities(text: string) {
  if (typeof document === 'undefined') return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
