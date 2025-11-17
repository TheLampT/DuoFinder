import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomBar from '../components/BottomBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "DuoFinder",
  description: "Tu dúo a un click",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="main-content">
          {children}
        </main>
        <BottomBar />
      </body>
    </html>
  );
}