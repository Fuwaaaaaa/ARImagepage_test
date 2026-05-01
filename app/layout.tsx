import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '画像認識 AR デモ',
  description: 'A-Frame と MindAR.js を使った画像ターゲット型 AR のデモ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
