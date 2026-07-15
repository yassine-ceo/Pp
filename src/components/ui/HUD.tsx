'use client'

import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import { setReady } from '@/lib/firebase'
import { Trophy, Volume2, VolumeX, RotateCcw, MessageCircle, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useMemo } from 'react'
import QuickChat from './QuickChat'
import ChatDrawer from './ChatDrawer'
import type { ChatBubble } from '@/lib/types'

const REMATCH_TIMEOUT = 30_000

function PlayerAvatar({ symbol, size = 'md' }: { symbol: 'X' | 'O'; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const text = size === 'sm' ? 'text-xs' : 'text-sm'
  const isX = symbol === 'X'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center ${text} font-bold shrink-0 ${
      isX
        ? 'bg-gradient-to-br from-cyan-400/25 to-cyan-400/10 border border-cyan-400/30 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
        : 'bg-gradient-to-br from-rose-400/25 to-rose-400/10 border border-rose-400/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
    }`}>
      {symbol}
    </div>
  )
}

function FloatingBubble({ bubble, align }: { bubble: ChatBubble; align: 'left' | 'right' }) {
  const isEmoji = bubble.content.length <= 6 && ['laugh', 'clown', 'angry', 'cry', 'shock'].includes(bubble.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.8 }}
      transition={{ duration: 0.25 }}
      className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-2 z-30 pointer-events-none`}
    >
      <div className={`rounded-xl px-3 py-2 backdrop-blur-xl border max-w-[180px] ${
        align === 'right'
          ? 'bg-cyan-400/15 border-cyan-400/20'
          : 'bg-white/[0.08] border-white/[0.1]'
      }`}>
        <p className="text-[11px] text-white/50 mb-0.5">{bubble.playerName}</p>
        <p className="text-sm text-white/90">{isEmoji ? getEmojiLabel(bubble.content) : bubble.content}</p>
      </div>
    </motion.div>
  )
}

function getEmojiLabel(id: string): string {
  switch (id) {
    case 'laugh': return '😂'
    case 'clown': return '🤡'
    case 'angry': return '😡'
    case 'cry': return '😭'
    case 'shock': return '🤯'
    default: return id
  }
}

export default function HUD() {
  const { room, roomId, playerId } = useGameStore()
  const [muted, setMuted] = useState(false)
  const [rematchTimeLeft, setRematchTimeLeft] = useState<number | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Rematch countdown
  useEffect(() => {
    if (!room || (room.status !== 'won' && room.status !== 'tie')) {
      setRematchTimeLeft(null)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const timerStart = room.rematchTimerStart
    if (!timerStart) {
      setRematchTimeLeft(null)
      return
    }

    const tick = () => {
      const elapsed = Date.now() - timerStart
      const remaining = Math.max(0, REMATCH_TIMEOUT - elapsed)
      setRematchTimeLeft(remaining)
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    tick()
    timerRef.current = setInterval(tick, 100)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [room?.status, room?.rematchTimerStart])

  const handleReady = () => {
    if (!roomId || !playerId) return
    soundManager.playClick()
    setReady(roomId, playerId)
  }

  // Floating bubbles
  const bubbles = useMemo(() => {
    if (!room?.bubbles) return []
    return Object.values(room.bubbles).sort((a, b) => a.timestamp - b.timestamp)
  }, [room?.bubbles])

  if (!room || !playerId) return null

  const me = room?.players?.p1?.id === playerId ? room?.players?.p1 : room?.players?.p2
  const opponent = room?.players?.p1?.id === playerId ? room?.players?.p2 : room?.players?.p1
  const isMyTurn = room?.turn === playerId
  const mySymbol = me?.symbol ?? 'X'
  const oppSymbol = mySymbol === 'X' ? 'O' : 'X'
  const amReady = !!(room?.ready && room.ready[playerId])
  const oppReady = !!(room?.ready && playerId && room.ready[Object.keys(room.ready).find((k) => k !== playerId) ?? ''])
  const timerPct = rematchTimeLeft !== null ? (rematchTimeLeft / REMATCH_TIMEOUT) * 100 : 0

  const myBubbles = bubbles.filter((b) => b.playerId === playerId)
  const oppBubbles = bubbles.filter((b) => b.playerId !== playerId)

  return (
    <>
      {/* === TOP HUD === */}
      <div className="fixed top-0 inset-x-0 z-20 px-3 pt-3 pointer-events-none">
        <div className="mx-auto max-w-md">
          {/* Player row */}
          <div className="flex items-start gap-2">
            {/* === ME === */}
            <div className="flex-1 min-w-0 pointer-events-auto">
              <div className="rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl px-3 py-2.5 relative">
                <div className="flex items-center gap-2.5">
                  <PlayerAvatar symbol={mySymbol} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-white truncate">{me?.name ?? 'You'}</p>
                    {isMyTurn && room?.status === 'playing' && (
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1 mt-0.5"
                      >
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        />
                        <span className="text-[10px] text-cyan-400 font-medium">Your turn</span>
                      </motion.div>
                    )}
                  </div>
                </div>
                {/* Floating bubbles - me */}
                <AnimatePresence>
                  {myBubbles.map((b) => (
                    <FloatingBubble key={b.id} bubble={b} align="right" />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* === SCORE === */}
            <div className="pointer-events-auto shrink-0">
              <div className="rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl px-4 py-2.5 text-center min-w-[70px]">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-lg font-bold text-cyan-400">{room?.scores?.p1 ?? 0}</span>
                  <span className="text-white/15 text-sm">:</span>
                  <span className="text-lg font-bold text-rose-400">{room?.scores?.p2 ?? 0}</span>
                </div>
                <p className="text-[8px] text-white/25 uppercase tracking-widest mt-0.5">Score</p>
              </div>
            </div>

            {/* === OPPONENT === */}
            <div className="flex-1 min-w-0 pointer-events-auto">
              <div className="rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl px-3 py-2.5 relative">
                <div className="flex items-center gap-2.5 flex-row-reverse">
                  <PlayerAvatar symbol={oppSymbol} />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[12px] font-semibold text-white truncate">{opponent?.name ?? 'Waiting...'}</p>
                    {!opponent && room?.status === 'waiting' && (
                      <p className="text-[10px] text-amber-400/70 font-medium mt-0.5">Code: {room?.code}</p>
                    )}
                    {oppReady && !amReady && (room?.status === 'won' || room?.status === 'tie') && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-[10px] text-amber-400/80 font-medium mt-0.5"
                      >
                        Ready to rematch!
                      </motion.p>
                    )}
                  </div>
                </div>
                {/* Floating bubbles - opponent */}
                <AnimatePresence>
                  {oppBubbles.map((b) => (
                    <FloatingBubble key={b.id} bubble={b} align="left" />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === BOTTOM BAR === */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-3 pb-3 pointer-events-none">
        <div className="mx-auto max-w-md flex items-center justify-between">
          {/* Room code */}
          <div className="pointer-events-auto rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl px-3 py-2">
            <p className="text-[8px] text-white/25 uppercase tracking-widest">Room</p>
            <p className="text-sm font-bold text-white tracking-[0.2em]">{room?.code}</p>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Sound */}
            <button
              onClick={() => {
                soundManager.playClick()
                const next = !muted
                setMuted(next)
                soundManager.setMuted(next)
              }}
              className="w-10 h-10 rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Chat */}
            <div className="relative">
              <button
                onClick={() => { soundManager.playClick(); setChatOpen(!chatOpen) }}
                className="w-10 h-10 rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
              >
                <MessageCircle size={16} />
              </button>
              <QuickChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
            </div>

            {/* Chat History */}
            <button
              onClick={() => { soundManager.playClick(); setDrawerOpen(true) }}
              className="w-10 h-10 rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* === WAITING OVERLAY === */}
      {room?.status === 'waiting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
        >
          <div className="rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl px-8 py-10 text-center max-w-sm mx-4">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-400/10 border border-amber-400/15 flex items-center justify-center">
              <Trophy size={28} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Waiting for opponent</h2>
            <p className="text-sm text-white/40 mb-6">Share this code with your friend:</p>
            <div className="rounded-xl bg-white/[0.06] border border-white/[0.08] px-6 py-4 mb-4">
              <p className="text-3xl font-mono font-bold text-white tracking-[0.3em]">{room?.code}</p>
            </div>
            <p className="text-xs text-white/25">Expires in 5 minutes if not joined</p>
          </div>
        </motion.div>
      )}

      {/* === WIN/LOSE/TIE OVERLAY === */}
      <AnimatePresence>
        {useGameStore.getState().showResult && (room?.status === 'won' || room?.status === 'tie') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
          >
            <div className="rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl px-8 py-10 text-center max-w-sm mx-4">
              {room?.status === 'tie' ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                    <span className="text-3xl">🤝</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">It&apos;s a Tie!</h2>
                </>
              ) : room?.winner === playerId ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cyan-400/10 border border-cyan-400/15 flex items-center justify-center">
                    <Trophy size={28} className="text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-cyan-400 mb-1">You Win!</h2>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-400/10 border border-rose-400/15 flex items-center justify-center">
                    <span className="text-3xl">😔</span>
                  </div>
                  <h2 className="text-2xl font-bold text-rose-400 mb-1">You Lose</h2>
                </>
              )}

              {/* Rematch section */}
              <div className="mt-6">
                {rematchTimeLeft !== null && rematchTimeLeft > 0 && (
                  <div className="mb-4">
                    <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-rose-400"
                        style={{ width: `${timerPct}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <p className="text-[11px] text-white/30 mt-2">
                      {Math.ceil(rematchTimeLeft / 1000)}s remaining
                    </p>
                  </div>
                )}

                {amReady && !oppReady && rematchTimeLeft !== null && rematchTimeLeft > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-amber-400/80 mb-3"
                  >
                    Waiting for opponent to accept...
                  </motion.p>
                )}

                <button
                  onClick={handleReady}
                  disabled={amReady}
                  className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    amReady
                      ? 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-400/50 cursor-default'
                      : 'bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/25'
                  }`}
                >
                  <RotateCcw size={15} />
                  {amReady ? 'Waiting for opponent...' : 'Play Again'}
                </button>

                {amReady && !oppReady && rematchTimeLeft !== null && rematchTimeLeft <= 0 && (
                  <p className="text-xs text-amber-400 mt-3">Rematch timed out!</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <ChatDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
