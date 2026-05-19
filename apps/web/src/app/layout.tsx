import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { InstallPWAPrompt } from '@/components/organisms/InstallPWAPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'Эста CRM',
  description: 'Интеллектуальная CRM для агентства недвижимости',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Эста CRM',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F2F7' },
    { media: '(prefers-color-scheme: dark)',  color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <InstallPWAPrompt />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
