import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'XO Arena — 3D Multiplayer Tic Tac Toe',
  description: 'Premium 3D multiplayer tic tac toe game with real-time matchmaking',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a1a] text-white overflow-hidden select-none`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}
