import type { ReactNode } from 'react'
import { Nunito } from 'next/font/google'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import './globals.css'

const nunito = Nunito({ subsets: ['latin'], weight: ['700', '800', '900'] })

export const metadata = {
  title: 'PlayOnline — Multi-Game Hub',
  description: 'Challenge friends to premium multiplayer games on the PlayOnline platform.',
  openGraph: {
    title: 'PlayOnline — Multi-Game Hub',
    description: 'Challenge friends to premium multiplayer games.',
    type: 'website',
    siteName: 'PlayOnline',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
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
      <body className={`${nunito.className} h-screen overflow-hidden bg-[#0f172a] text-white select-none`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}
