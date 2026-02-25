import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Layout/Header";
import { AdminProvider } from "@/context/AdminContext";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "SSAFY 11반 노래 큐",
  description: "벌칙 노래 큐 관리 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased min-h-screen transition-colors duration-300">
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <AdminProvider>
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
              {children}
            </main>
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
