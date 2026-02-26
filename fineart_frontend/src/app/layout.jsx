import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import MainWithSidebar from '@/components/MainWithSidebar';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'FineArt Platform',
  description: 'FineArt · Digital gallery platform for artists, articles, and curated collections.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-neutral-900`}>
        <div className="min-h-screen text-base text-neutral-900">
          <div className="flex min-h-screen flex-col bg-[var(--board-bg)]">
            <TopNav />
            <main className="flex-1 pt-6"><MainWithSidebar>{children}</MainWithSidebar></main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
