'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            SSAFY 11반 노래 큐
          </h1>

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
        </div>
      </div>
    </header>
  );
}
