import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import './globals.css'

const nunito = Nunito({ subsets: ['latin'], weight: ['700', '800', '900'] })

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'PlayOnline',
  description: 'PlayOnline Game Studio',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PlayOnline',
  },
  openGraph: {
    title: 'PlayOnline',
    description: 'PlayOnline Game Studio',
    type: 'website',
    siteName: 'PlayOnline',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-screen overflow-hidden">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className={`${nunito.className} h-screen overflow-hidden text-white select-none`}
        style={{ background: '#0f172a' }}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}
