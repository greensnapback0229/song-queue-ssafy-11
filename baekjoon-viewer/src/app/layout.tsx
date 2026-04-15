import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baekjoon Viewer",
  description: "백준 문제 브라우저 - 티어/태그별 필터링",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "'Noto Sans KR', -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
