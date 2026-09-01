import './globals.css';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

export const metadata = { title: 'Auto Clipper - Turn Long Videos Into Viral Shorts', description: 'AI powered auto clipper' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className={inter.className + ' bg-[#0a0a0f] text-white antialiased'}>{children}</body>
    </html>
  );
}
