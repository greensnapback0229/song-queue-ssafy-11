'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { isAdmin, login, logout } = useAdmin();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
    setPasswordInput('');
    setLoginError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const success = await login(passwordInput);
    setIsLoggingIn(false);

    if (success) {
      setIsLoginModalOpen(false);
      setPasswordInput('');
    } else {
      setLoginError('비밀번호가 틀렸습니다');
    }
  };

  return (
    <>
      <header className="bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-white/10 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform overflow-hidden border border-gray-100 dark:border-white/10">
                <span className="text-xl">🎤</span>
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white font-title">
                SSAFY <span className="text-toss-blue">11반</span> 노래 큐
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/"
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 ${
                    pathname === '/'
                      ? 'bg-gray-100 dark:bg-white/10 text-toss-blue'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  큐
                </Link>
                <Link
                  href="/history"
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 ${
                    pathname === '/history'
                      ? 'bg-gray-100 dark:bg-white/10 text-toss-blue'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  내역
                </Link>
              </nav>

              <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-1 sm:gap-2">
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-all"
                    aria-label="테마 변경"
                  >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                )}
                
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block px-2.5 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold ring-1 ring-inset ring-green-600/20 dark:ring-green-400/20">
                      관리자
                    </span>
                    <button
                      onClick={logout}
                      className="text-sm font-semibold text-red-500 hover:text-red-600"
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLoginClick}
                    className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    관리자
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-[24px] shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-100 dark:border-white/10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-title">관리자 로그인</h2>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-bold text-gray-500 dark:text-gray-400 ml-1">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-toss-blue text-gray-900 dark:text-white transition-all"
                  disabled={isLoggingIn}
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
                  {loginError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  disabled={isLoggingIn}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-50 transition-all font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn || !passwordInput.trim()}
                  className="flex-1 px-4 py-3 bg-toss-blue text-white rounded-xl hover:bg-toss-blue-hover shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all font-bold"
                >
                  {isLoggingIn ? '확인 중...' : '로그인'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
