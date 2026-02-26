'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SingingSession, Comment } from '@/types';
import { useAdmin } from '@/context/AdminContext';
import YouTubeBackground from '@/components/Singing/YouTubeBackground';
import { useTheme } from 'next-themes';
import { Sun, Moon, MessageSquare, X, Send, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

export default function SingingPage() {
  const { isAdmin, password } = useAdmin();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<SingingSession | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [bgMuted, setBgMuted] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current singing session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/singing/current');
        const data = await res.json();

        if (!data.session) {
          router.push('/');
          return;
        }

        setSession(data.session);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        router.push('/');
      }
    };

    fetchSession();
  }, [router]);

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    if (!session) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        if (isMounted) setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'comment') {
            setComments((prev) => [...prev, {
              nickname: data.nickname,
              content: data.content,
              timestamp: data.timestamp
            }]);
          } else if (data.type === 'session_ended') {
            router.push('/');
            return;
          } else if (data.type === 'history') {
            // 서버에서 기존 댓글 히스토리 수신
            setComments(data.comments.map((c: { nickname: string; content: string; timestamp: number }) => ({
              nickname: c.nickname,
              content: c.content,
              timestamp: c.timestamp
            })));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`);
        if (isMounted) {
          setWsConnected(false);
          // 3초 후 재연결 시도
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (isMounted) setWsConnected(false);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [session]);

  // Auto-scroll to newest comment
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim() || !content.trim() || !wsRef.current || !wsConnected) {
      return;
    }

    const commentData = {
      type: 'comment',
      nickname: nickname.trim(),
      content: content.trim(),
      timestamp: Date.now()
    };

    wsRef.current.send(JSON.stringify(commentData));
    setContent('');
  };

  const handleComplete = async () => {
    if (!session || isCompleting || !isAdmin) return;

    setIsCompleting(true);
    try {
      const res = await fetch('/api/singing/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ session_id: session.id })
      });

      if (res.ok) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // 서버 메모리의 댓글 초기화
          wsRef.current.send(JSON.stringify({ type: 'clear_comments' }));
          // 모든 클라이언트에게 세션 종료 알림
          wsRef.current.send(JSON.stringify({ type: 'session_ended' }));
        } else {
          router.push('/');
        }
      } else {
        throw new Error('Failed to complete session');
      }
    } catch (error) {
      console.error('Failed to complete session:', error);
      toast.error('노래 완료 처리에 실패했습니다.');
      setIsCompleting(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-toss-blue border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-500 dark:text-gray-400 font-bold">무대 준비 중...</div>
        </div>
      </div>
    );
  }

  const hasVideo = !!session.youtube_video_id;

  return (
    <div className="fixed inset-0 z-50 flex bg-white dark:bg-gray-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Main singing area */}
      <div className="flex-1 relative overflow-hidden text-gray-900 dark:text-white">
        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 z-40">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-3 rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-xl px-4 py-3 shadow-lg">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-toss-blue/10 dark:bg-toss-blue/20 border border-toss-blue/20 dark:border-toss-blue/30 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-toss-blue shadow-[0_0_10px_rgba(49,130,246,0.8)]" />
                    <span className="text-[11px] font-black text-toss-blue tracking-wider uppercase">Live</span>
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-300 truncate">
                    {session.reason}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
                  <div className="font-title font-black text-lg sm:text-2xl text-gray-950 dark:text-white truncate max-w-[70vw]">
                    {session.song_title}
                  </div>
                  <div className="text-sm sm:text-base font-black text-gray-600 dark:text-gray-200 truncate max-w-[60vw]">
                    {session.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && (
                  <button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="h-10 px-4 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-black shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                  >
                    {isCompleting ? '종료 중...' : '노래 종료'}
                  </button>
                )}

                <button
                  onClick={() => setBgMuted((prev) => !prev)}
                  className="w-10 h-10 bg-gray-100/90 dark:bg-white/10 hover:bg-gray-200/90 dark:hover:bg-white/20 backdrop-blur-md border border-gray-200/70 dark:border-white/10 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                  aria-label={bgMuted ? '사운드 켜기' : '사운드 끄기'}
                >
                  {bgMuted ? <VolumeX size={18} className="text-gray-700 dark:text-white" /> : <Volume2 size={18} className="text-gray-700 dark:text-white" />}
                </button>

                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-10 h-10 bg-gray-100/90 dark:bg-white/10 hover:bg-gray-200/90 dark:hover:bg-white/20 backdrop-blur-md border border-gray-200/70 dark:border-white/10 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                    aria-label="테마 변경"
                  >
                    {theme === 'dark' ? <Sun size={18} className="text-white" /> : <Moon size={18} className="text-gray-700" />}
                  </button>
                )}

                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`w-10 h-10 bg-gray-100/90 dark:bg-white/10 hover:bg-gray-200/90 dark:hover:bg-white/20 backdrop-blur-md border border-gray-200/70 dark:border-white/10 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isChatOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  aria-label="채팅 열기"
                >
                  <MessageSquare size={18} className="text-gray-700 dark:text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 배경 레이어 */}
        {hasVideo ? (
          <>
            <YouTubeBackground videoId={session.youtube_video_id!} muted={bgMuted} />
            <div className="absolute inset-0 bg-black/10 dark:bg-black/35 z-10 transition-colors duration-300" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-black transition-colors duration-300" />
        )}
      </div>

      {/* Comments sidebar */}
      <div className={`${isChatOpen ? 'w-[400px]' : 'w-0'} bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-l border-gray-200 dark:border-white/10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-30 transition-all duration-500 overflow-hidden`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 min-w-[400px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              실시간 채팅
              {wsConnected && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                {comments.length} MESSAGES
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 min-w-[400px]">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-gray-400 dark:text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-300 font-bold">채팅방이 비어있습니다.</p>
              <p className="text-gray-400 dark:text-gray-400 text-sm mt-1">응원 메시지를 남겨보세요!</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <div
                key={index}
                className="group animate-in slide-in-from-right-4 duration-300"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-black text-sm text-toss-blue">
                    {comment.nickname}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400">
                    {formatTime(comment.timestamp)}
                  </span>
                </div>
                <div className="bg-gray-100 dark:bg-white/5 group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors p-3.5 rounded-2xl rounded-tl-none border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-200 leading-relaxed shadow-sm">
                  {comment.content}
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment input form */}
        <div className="p-6 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 min-w-[400px]">
          <form onSubmit={handleSendComment} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-toss-blue/50 focus:bg-white/10 dark:focus:bg-white/10 text-gray-900 dark:text-white font-bold placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                maxLength={20}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="응원의 한마디..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 px-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-toss-blue/50 focus:bg-white/10 dark:focus:bg-white/10 text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                maxLength={100}
              />
              <button
                type="submit"
                disabled={!wsConnected || !nickname.trim() || !content.trim()}
                className="w-12 h-12 flex items-center justify-center bg-toss-blue hover:bg-toss-blue-hover disabled:bg-gray-200 dark:disabled:bg-gray-800 text-white rounded-2xl transition-all active:scale-90 shadow-md shadow-toss-blue/20"
              >
                <Send size={20} className="ml-0.5" />
              </button>
            </div>
          </form>
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
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        [data-theme='dark'] .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        [data-theme='dark'] .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
