'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [connectedPlayers, setConnectedPlayers] = useState(1)
  const [copied, setCopied] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatText, setChatText] = useState('')
  const chatInputRef = useRef<HTMLInputElement>(null)
  const typingSentRef = useRef(false)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect touch device
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    setIsTouchDevice(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Listen for player count from iframe
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.action === 'PLAYER_COUNT') {
        setConnectedPlayers(e.data.count)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Expose Firebase to iframe
  useEffect(() => {
    const w = window as any
    w.__dungeonRunDb = db
    w.__dungeonRunRefs = { ref, set, update, onValue, off, remove, onDisconnect, serverTimestamp }

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    if (isMobile) {
      const triggerMobileFullscreenLandscape = async () => {
        try {
          const doc = document.documentElement as any;
          if (doc.requestFullscreen) {
            await doc.requestFullscreen();
          } else if (doc.webkitRequestFullscreen) {
            await doc.webkitRequestFullscreen();
          } else if (doc.msRequestFullscreen) {
            await doc.msRequestFullscreen();
          }
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch (err) {
          console.warn('Orientation lock / Fullscreen request bypassed:', err);
        }
      }
      triggerMobileFullscreenLandscape()
    }

    return () => {
      delete w.__dungeonRunDb
      delete w.__dungeonRunRefs
    }
  }, [])

  const gameUrl = `/assets/Ninja-Multiplayer-Platformer-master/index.html?roomCode=${encodeURIComponent(roomCode)}&playerId=${encodeURIComponent(playerId)}&playerName=${encodeURIComponent(playerName)}&isHost=${isHost ? '1' : '0'}`

  const postMsg = useCallback((action: string, isDown: boolean) => {
    iframeRef.current?.contentWindow?.postMessage({ action, isDown }, '*')
  }, [])

  const handleCopyRoom = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [roomCode])

  const safeRight = 'max(16px, env(safe-area-inset-right, 16px))'

  const handleExit = useCallback(() => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
    if (screen.orientation && (screen.orientation as any).unlock) {
      (screen.orientation as any).unlock();
    }
    onBack();
  }, [onBack])

  const postChat = useCallback((text: string) => {
    iframeRef.current?.contentWindow?.postMessage({ action: 'CHAT_MESSAGE', text }, '*')
  }, [])

  const postTyping = useCallback((isTyping: boolean) => {
    iframeRef.current?.contentWindow?.postMessage({ action: 'TYPING', isTyping }, '*')
  }, [])

  const openChat = useCallback(() => {
    setChatOpen(true)
    setChatText('')
    setTimeout(() => chatInputRef.current?.focus(), 150)
  }, [])

  const closeChat = useCallback(() => {
    setChatOpen(false)
    chatInputRef.current?.blur()
    if (typingSentRef.current) {
      typingSentRef.current = false
      postTyping(false)
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
  }, [postTyping])

  const sendChat = useCallback(() => {
    const text = chatText.trim()
    if (!text) return
    postChat(text)
    closeChat()
  }, [chatText, postChat, closeChat])

  const handleChatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChatText(e.target.value)
    if (!typingSentRef.current) {
      typingSentRef.current = true
      postTyping(true)
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      typingSentRef.current = false
      postTyping(false)
    }, 2000)
  }, [postTyping])

  const handleChatKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendChat()
    }
    if (e.key === 'Escape') {
      closeChat()
    }
  }, [sendChat, closeChat])

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <iframe
        ref={iframeRef}
        src={gameUrl}
        className="w-full h-full border-0"
        title="Ninja Multiplayer Platformer"
        allow="fullscreen; screen-wake-lock"
        style={{ display: 'block' }}
      />

      {/* Room Code + Copy — top of right black bar, hidden when 2/2 */}
      {connectedPlayers < 2 && (
        <div
          style={{ right: safeRight }}
          className="fixed top-6 z-[99999] flex flex-col items-end gap-1.5 pointer-events-none"
        >
          <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-semibold pointer-events-auto">
            Room Code
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-base font-bold text-white/80 tracking-[0.3em] select-all">{roomCode}</span>
            <button
              onClick={handleCopyRoom}
              className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-white/60 text-xs font-semibold hover:bg-white/20 hover:text-white/80 transition-all active:scale-95"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Chat button — top of right black bar, shown when room is full */}
      {connectedPlayers >= 2 && (
        <div
          style={{ right: safeRight }}
          className="fixed top-6 z-[99999] pointer-events-none"
        >
          <button
            onClick={openChat}
            className="pointer-events-auto w-11 h-11 rounded-full bg-black/80 hover:bg-black/70 border border-white/20 backdrop-blur-md flex items-center justify-center active:scale-95 touch-none select-none transition-all shadow-lg"
            aria-label="Chat"
          >
            <svg className="w-5 h-5 fill-white/90 pointer-events-none" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Touch controls — center of right black bar (always visible on touch) */}
      {isTouchDevice && (
        <>
          <button
            aria-label="Left"
            onPointerDown={(e) => { e.preventDefault(); postMsg('MOVE_LEFT', true) }}
            onPointerUp={(e) => { e.preventDefault(); postMsg('MOVE_LEFT', false) }}
            onPointerLeave={(e) => { e.preventDefault(); postMsg('MOVE_LEFT', false) }}
            onPointerCancel={(e) => { e.preventDefault(); postMsg('MOVE_LEFT', false) }}
            style={{ right: '88px' }}
            className="fixed top-1/2 -translate-y-1/2 z-[99999] w-12 h-16 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md flex items-center justify-center active:bg-white/25 touch-none select-none"
          >
            <svg className="w-6 h-6 fill-white/80 pointer-events-none" viewBox="0 0 24 24">
              <polygon points="16,4 6,12 16,20 14,20 4,12 14,4" />
            </svg>
          </button>
          <button
            aria-label="Right"
            onPointerDown={(e) => { e.preventDefault(); postMsg('MOVE_RIGHT', true) }}
            onPointerUp={(e) => { e.preventDefault(); postMsg('MOVE_RIGHT', false) }}
            onPointerLeave={(e) => { e.preventDefault(); postMsg('MOVE_RIGHT', false) }}
            onPointerCancel={(e) => { e.preventDefault(); postMsg('MOVE_RIGHT', false) }}
            style={{ right: safeRight }}
            className="fixed top-1/2 -translate-y-1/2 z-[99999] w-12 h-16 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md flex items-center justify-center active:bg-white/25 touch-none select-none"
          >
            <svg className="w-6 h-6 fill-white/80 pointer-events-none" viewBox="0 0 24 24">
              <polygon points="8,4 18,12 8,20 10,20 20,12 10,4" />
            </svg>
          </button>
        </>
      )}

      {/* EXIT button — bottom of right black bar */}
      {isTouchDevice && (
        <div
          className="fixed bottom-8 z-[99999] pointer-events-none flex items-center justify-center"
          style={{ left: 'auto', right: safeRight, width: '120px' }}
        >
          <button
            onClick={handleExit}
            className="pointer-events-auto w-28 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 backdrop-blur-md text-red-100 rounded-xl text-xs font-black tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center text-center touch-none select-none"
          >
            EXIT
          </button>
        </div>
      )}

      {/* Chat input bar */}
      {chatOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[99999] p-3 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center gap-2">
          <input
            ref={chatInputRef}
            type="text"
            value={chatText}
            onChange={handleChatChange}
            onKeyDown={handleChatKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-white/30"
          />
          <button
            onClick={sendChat}
            className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-semibold active:scale-95 transition-all touch-none select-none"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
