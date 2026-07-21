'use client'

import { useEffect, useRef } from 'react'
import { ref, set, update, onValue, off, remove, onDisconnect, serverTimestamp } from 'firebase/database'
import { db } from '@/lib/firebase'

interface DungeonRunProps {
  roomCode: string
  playerId: string
  playerName: string
  isHost: boolean
  onBack: () => void
}

export default function DungeonRun({ roomCode, playerId, playerName, isHost, onBack }: DungeonRunProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Expose database and RTDB methods to the child iframe
    const w = window as any
    w.__dungeonRunDb = db
    w.__dungeonRunRefs = { ref, set, update, onValue, off, remove, onDisconnect, serverTimestamp }

    // Check if the user is on a mobile device and trigger fullscreen / landscape lock
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    if (isMobile) {
      const lockLandscapeAndFullscreen = async () => {
        try {
          const docEl = document.documentElement as any
          if (docEl.requestFullscreen) {
            await docEl.requestFullscreen()
          } else if (docEl.mozRequestFullScreen) {
            await docEl.mozRequestFullScreen()
          } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen()
          } else if (docEl.msRequestFullscreen) {
            await docEl.msRequestFullscreen()
          }

          const screenObj = window.screen as any
          if (screenObj.orientation && screenObj.orientation.lock) {
            await screenObj.orientation.lock('landscape')
              .catch(() => screenObj.orientation.lock('landscape-primary'))
              .catch((err: any) => console.warn('Orientation lock rejected:', err))
          } else if (screenObj.lockOrientation) {
            screenObj.lockOrientation('landscape')
          } else if (screenObj.mozLockOrientation) {
            screenObj.mozLockOrientation('landscape')
          } else if (screenObj.msLockOrientation) {
            screenObj.msLockOrientation('landscape')
          }
        } catch (error) {
          console.error('Fullscreen/orientation lock failed:', error)
        }
      }
      lockLandscapeAndFullscreen()
    }

    return () => {
      delete w.__dungeonRunDb
      delete w.__dungeonRunRefs
    }
  }, [])

  // Build the game URL with query parameters for room synchronization
  const gameUrl = `/assets/Ninja-Multiplayer-Platformer-master/index.html?roomCode=${encodeURIComponent(roomCode)}&playerId=${encodeURIComponent(playerId)}&playerName=${encodeURIComponent(playerName)}&isHost=${isHost ? '1' : '0'}`

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col">
      {/* Floating Glassmorphism Header */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60 hover:text-white transition-all active:scale-95"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <div className="px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-xs font-semibold text-white/90">
          Room: <span className="text-amber-400 uppercase tracking-wider">{roomCode}</span>
        </div>
      </div>

      {/* Embed local Phaser multi-player game */}
      <iframe
        ref={iframeRef}
        src={gameUrl}
        className="w-full h-full border-0"
        title="Ninja Multiplayer Platformer"
        allow="fullscreen; screen-wake-lock"
        style={{ display: 'block' }}
      />
    </div>
  )
}
