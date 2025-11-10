import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import { DialogProvider } from '@/components/DialogContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'optional',
  preload: false, // Disable preload untuk mono karena jarang digunakan di halaman login
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: 'Lab IPA BPI - Sistem Informasi Laboratorium',
  description: 'Sistem Informasi Laboratorium IPA untuk Sekolah BPI Bandung',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <DialogProvider>{children}</DialogProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
