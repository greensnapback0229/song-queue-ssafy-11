'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const { isAdmin, login, logout } = useAdmin();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              SSAFY 11반 노래 큐
            </h1>

            <div className="flex items-center gap-4">
              <nav className="flex gap-2">
                <Link
                  href="/"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    pathname === '/'
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'bg-purple-500/30 hover:bg-purple-500/50'
                  }`}
                >
                  큐
                </Link>
                <Link
                  href="/history"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    pathname === '/history'
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'bg-purple-500/30 hover:bg-purple-500/50'
                  }`}
                >
                  내역
                </Link>
              </nav>

              {/* Admin Login/Logout */}
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <span className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium">
                      관리자 ✓
                    </span>
                    <button
                      onClick={logout}
                      className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLoginClick}
                    className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg font-medium transition-all duration-200"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">관리자 로그인</h2>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  disabled={isLoggingIn}
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {loginError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  disabled={isLoggingIn}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn || !passwordInput.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
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
