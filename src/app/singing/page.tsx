'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { SingingSession, Comment } from '@/types';
import { useAdmin } from '@/context/AdminContext';

export default function SingingPage() {
  const { isAdmin, password } = useAdmin();
  const router = useRouter();
  const [session, setSession] = useState<SingingSession | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

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
        router.push('/');
      } else {
        throw new Error('Failed to complete session');
      }
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('노래 완료 처리 실패');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800">
      {/* Main singing area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white">
        <div className="text-center space-y-8 max-w-4xl">
          <div>
            <div className="text-2xl mb-4 text-purple-200">지금 부르는 사람</div>
            <div className="text-8xl font-bold mb-6 drop-shadow-2xl">
              {session.name}
            </div>
          </div>

          <div>
            <div className="text-xl mb-2 text-purple-200">노래 제목</div>
            <div className="text-4xl font-semibold text-yellow-300 drop-shadow-lg">
              {session.song_title}
            </div>
          </div>

          <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="text-lg mb-2 text-purple-200">벌칙 사유</div>
            <div className="text-2xl text-pink-200">
              {session.reason}
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="mt-12 px-12 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-2xl font-bold rounded-lg shadow-xl transition-colors"
            >
              {isCompleting ? '처리 중...' : '노래 완료'}
            </button>
          )}
        </div>
      </div>

      {/* Comments sidebar */}
      <div className="w-96 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-purple-700 text-white">
          <h2 className="text-xl font-bold">실시간 댓글</h2>
          <div className="text-sm mt-1">
            {wsConnected ? (
              <span className="text-green-300">● 연결됨</span>
            ) : (
              <span className="text-red-300">● 연결 중...</span>
            )}
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {comments.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              첫 댓글을 남겨보세요!
            </div>
          ) : (
            comments.map((comment, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-bold text-purple-700">
                    {comment.nickname}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(comment.timestamp)}
                  </span>
                </div>
                <div className="text-gray-800">
                  {comment.content}
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment input form */}
        <form onSubmit={handleSendComment} className="p-4 bg-white border-t border-gray-200">
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            maxLength={20}
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="댓글 내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              maxLength={100}
            />
            <button
              type="submit"
              disabled={!wsConnected || !nickname.trim() || !content.trim()}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-400 text-white rounded font-semibold transition-colors"
            >
              전송
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
