import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'XO Arena — 3D Multiplayer Tic Tac Toe',
  description: 'Challenge friends to a premium 3D multiplayer tic tac toe game with real-time matchmaking, neon-lit pieces, and epic win animations.',
  openGraph: {
    title: 'XO Arena — 3D Multiplayer Tic Tac Toe',
    description: 'Challenge friends to a premium 3D multiplayer tic tac toe game.',
    type: 'website',
    siteName: 'XO Arena',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a1a',
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
      <body className={`${inter.className} h-screen overflow-hidden bg-[#0a0a1a] text-white select-none`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}
