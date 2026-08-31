import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { PWA } from '@/components/pwa'
import './globals.css'

export const metadata: Metadata = {
  title: 'Re:LIFE — 整える、をもっとやさしく。',
  description: 'スクリーンタイムを見える化して、明日の習慣をやさしく整える。',
  applicationName: 'Re:LIFE',
  appleWebApp: {
    capable: true,
    title: 'Re:LIFE',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon-512.png',
    apple: '/apple-touch-icon.png',
  },
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fffaf7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="bg-background">
      <body className="antialiased">
        {children}
        <PWA />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
