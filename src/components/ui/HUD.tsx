'use client'

import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import { setReady, deleteRoom } from '@/lib/firebase'
import { TURN_TIME_LIMIT } from '@/lib/types'
import { Trophy, Volume2, VolumeX, RotateCcw, MessageCircle, LogOut, Copy, Share2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import QuickChat from './QuickChat'
import ChatDrawer from './ChatDrawer'
import { EmojiIcon } from './QuickChat'
import type { ChatBubble } from '@/lib/types'

const REMATCH_TIMEOUT = 30_000
const EMOJI_IDS = ['laugh', 'clown', 'angry', 'cry', 'shock']

function PlayerAvatar({ symbol, size = 'md' }: { symbol: 'X' | 'O'; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-9 h-9'
  const text = size === 'sm' ? 'text-[9px]' : 'text-xs'
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

function MiniAvatar({ symbol }: { symbol: 'X' | 'O' }) {
  const isX = symbol === 'X'
  return (
    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 ${
      isX
        ? 'bg-cyan-400/20 border border-cyan-400/30 text-cyan-400'
        : 'bg-rose-400/20 border border-rose-400/30 text-rose-400'
    }`}>
      {symbol}
    </div>
  )
}

function StackedBubble({ bubble, align, symbol }: { bubble: ChatBubble; align: 'left' | 'right'; symbol: 'X' | 'O' }) {
  const isEmoji = EMOJI_IDS.includes(bubble.content)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.9 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'} items-start gap-1`}
    >
      {align === 'left' && <MiniAvatar symbol={symbol} />}
      <div className={`rounded-xl px-2.5 py-1.5 max-w-[140px] backdrop-blur-xl border ${
        align === 'right'
          ? 'bg-cyan-400/15 border-cyan-400/20'
          : 'bg-white/[0.08] border-white/[0.1]'
      }`}>
        {isEmoji ? (
          <div className="flex items-center justify-center">
            <EmojiIcon type={bubble.content} size={22} />
          </div>
        ) : (
          <p className="text-[11px] text-white/80 break-words leading-tight">{bubble.content}</p>
        )}
      </div>
      {align === 'right' && <MiniAvatar symbol={symbol} />}
    </motion.div>
  )
}

export default function HUD() {
  const router = useRouter()
  const { room, roomId, playerId, room: roomState } = useGameStore()
  const [muted, setMuted] = useState(false)
  const [rematchTimeLeft, setRematchTimeLeft] = useState<number | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickPlayedRef = useRef(false)
  const lastOppEmojiRef = useRef<number>(0)
  const [tick, setTick] = useState(0)
  const rafRef = useRef<number>(0)

  const isMyTurn = room?.turn === playerId && room?.status === 'playing'

  // Smooth tick for timer bar updates (both players see it)
  useEffect(() => {
    if (!room?.turnStartTime || room.status !== 'playing') return
    const animate = () => {
      setTick((t) => t + 1)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [room?.turnStartTime, room?.status])

  // Opponent emoji sound sync
  useEffect(() => {
    if (!room?.bubbles || !playerId) return
    const oppBubbles = Object.values(room.bubbles)
      .filter((b) => b.playerId !== playerId && EMOJI_IDS.includes(b.content))
      .sort((a, b) => a.timestamp - b.timestamp)
    const latest = oppBubbles[oppBubbles.length - 1]
    if (latest && latest.timestamp > lastOppEmojiRef.current) {
      lastOppEmojiRef.current = latest.timestamp
      soundManager.playEmoji(latest.content)
    }
  }, [room?.bubbles, playerId])

  const handleCopyCode = useCallback(async () => {
    if (!room?.code) return
    try {
      await navigator.clipboard.writeText(room.code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 1500)
    } catch {
    }
  }, [room?.code])

  const handleShare = useCallback(async () => {
    if (!room?.code) return
    const url = `${window.location.origin}/room/${room.code}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'XO Arena - Join my game!', text: `Join my XO Arena game! Room code: ${room.code}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 1500)
      }
    } catch {
    }
  }, [room?.code])

  // Turn timer - computed on every tick for smooth bar, both players see it
  const turnTimeLeft = useMemo(() => {
    if (!room?.turnStartTime || room.status !== 'playing') return null
    const elapsed = Date.now() - room.turnStartTime
    return Math.max(0, TURN_TIME_LIMIT - elapsed)
  }, [room?.turnStartTime, room?.status, roomState, tick])

  // Tick sound - plays once when time drops below 5s for the active player
  useEffect(() => {
    if (isMyTurn && turnTimeLeft !== null && turnTimeLeft <= 5000 && turnTimeLeft > 0 && !tickPlayedRef.current) {
      soundManager.playTick()
      tickPlayedRef.current = true
    }
    if (turnTimeLeft === null || (turnTimeLeft !== null && turnTimeLeft > 5000)) {
      tickPlayedRef.current = false
    }
  }, [turnTimeLeft, isMyTurn])

  // Rematch countdown
  useEffect(() => {
    if (!room || (room.status !== 'won' && room.status !== 'tie')) {
      setRematchTimeLeft(null)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    const timerStart = room.rematchTimerStart
    if (!timerStart) { setRematchTimeLeft(null); return }
    const tick = () => {
      const remaining = Math.max(0, REMATCH_TIMEOUT - (Date.now() - timerStart))
      setRematchTimeLeft(remaining)
      if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current)
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

  const handleExit = useCallback(async () => {
    soundManager.playClick()
    if (roomId) {
      try { await deleteRoom(roomId) } catch {}
    }
    useGameStore.getState().setRoom(null)
    useGameStore.getState().setRoomId(null)
    useGameStore.getState().setWinHighlightCells([])
    useGameStore.getState().setShowResult(false)
    router.push('/')
  }, [roomId, router])

  // Bubble display: latest emoji per player + last 3 text per player
  const myBubbles = useMemo(() => {
    if (!room?.bubbles || !playerId) return []
    const all = Object.values(room.bubbles)
      .filter((b) => b.playerId === playerId)
      .sort((a, b) => a.timestamp - b.timestamp)
    const emojis = all.filter((b) => EMOJI_IDS.includes(b.content)).slice(-1)
    const texts = all.filter((b) => !EMOJI_IDS.includes(b.content)).slice(-3)
    return [...texts, ...emojis].sort((a, b) => a.timestamp - b.timestamp)
  }, [room?.bubbles, playerId])

  const oppBubbles = useMemo(() => {
    if (!room?.bubbles || !playerId) return []
    const all = Object.values(room.bubbles)
      .filter((b) => b.playerId !== playerId)
      .sort((a, b) => a.timestamp - b.timestamp)
    const emojis = all.filter((b) => EMOJI_IDS.includes(b.content)).slice(-1)
    const texts = all.filter((b) => !EMOJI_IDS.includes(b.content)).slice(-3)
    return [...texts, ...emojis].sort((a, b) => a.timestamp - b.timestamp)
  }, [room?.bubbles, playerId])

  if (!room || !playerId) return null

  const me = room?.players?.p1?.id === playerId ? room?.players?.p1 : room?.players?.p2
  const opponent = room?.players?.p1?.id === playerId ? room?.players?.p2 : room?.players?.p1
  const mySymbol = me?.symbol ?? 'X'
  const oppSymbol = mySymbol === 'X' ? 'O' : 'X'
  const amReady = !!(room?.ready && room.ready[playerId])
  const oppReady = !!(room?.ready && playerId && room.ready[Object.keys(room.ready).find((k) => k !== playerId) ?? ''])
  const timerPct = rematchTimeLeft !== null ? (rematchTimeLeft / REMATCH_TIMEOUT) * 100 : 0
  const turnPct = turnTimeLeft !== null ? (turnTimeLeft / TURN_TIME_LIMIT) * 100 : 0

  const myGlow = isMyTurn
    ? mySymbol === 'X'
      ? 'shadow-[0_0_15px_rgba(34,211,238,0.25)] border-cyan-400/40'
      : 'shadow-[0_0_15px_rgba(244,63,94,0.25)] border-rose-400/40'
    : ''

  const oppGlow = room?.turn !== playerId && room?.status === 'playing' && opponent
    ? oppSymbol === 'X'
      ? 'shadow-[0_0_15px_rgba(34,211,238,0.25)] border-cyan-400/40'
      : 'shadow-[0_0_15px_rgba(244,63,94,0.25)] border-rose-400/40'
    : ''

  const isOppTurn = room?.turn !== playerId && room?.status === 'playing'

  return (
    <>
      {/* TOP HUD */}
      <div className="fixed top-0 inset-x-0 z-20 px-4 pt-14 sm:pt-16 sm:px-6 md:px-8 pointer-events-none" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top, 3.5rem))' }}>
        <div className="mx-auto max-w-md">
          <div className="flex items-start gap-1.5 sm:gap-2">
            {/* ME */}
            <div className="flex-1 min-w-0 pointer-events-auto">
              <div className={`rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl px-2.5 py-2 sm:px-3 sm:py-2.5 relative transition-all duration-300 overflow-hidden ${myGlow}`}>
                <div className="flex items-center gap-2">
                  <PlayerAvatar symbol={mySymbol} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-[12px] font-semibold text-white truncate">{me?.name ?? 'You'}</p>
                    {isMyTurn && (
                      <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1 mt-0.5">
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className={`w-1.5 h-1.5 rounded-full ${mySymbol === 'X' ? 'bg-cyan-400' : 'bg-rose-400'}`} />
                        <span className={`text-[9px] sm:text-[10px] font-medium ${mySymbol === 'X' ? 'text-cyan-400' : 'text-rose-400'}`}>Your turn</span>
                      </motion.div>
                    )}
                  </div>
                </div>
                {isMyTurn && turnTimeLeft !== null && (
                  <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden w-full">
                    <div
                      className="h-full rounded-full transition-none"
                      style={{
                        width: `${turnPct}%`,
                        backgroundColor: turnPct > 50 ? (mySymbol === 'X' ? '#22d3ee' : '#f43f5e') : turnPct > 20 ? '#FBBF24' : '#EF4444',
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1 mt-1">
                  <AnimatePresence>
                    {myBubbles.map((b) => (
                      <StackedBubble key={b.id} bubble={b} align="right" symbol={mySymbol} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* SCORE */}
            <div className="pointer-events-auto shrink-0">
              <div className="rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-2.5 text-center min-w-[60px] sm:min-w-[70px]">
                <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
                  <span className="text-base sm:text-lg font-bold text-cyan-400">{room?.scores?.p1 ?? 0}</span>
                  <span className="text-white/15 text-sm">:</span>
                  <span className="text-base sm:text-lg font-bold text-rose-400">{room?.scores?.p2 ?? 0}</span>
                </div>
                <p className="text-[7px] sm:text-[8px] text-white/25 uppercase tracking-widest mt-0.5">Score</p>
              </div>
            </div>

            {/* OPPONENT */}
            <div className="flex-1 min-w-0 pointer-events-auto">
              <div className={`rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl px-2.5 py-2 sm:px-3 sm:py-2.5 relative transition-all duration-300 overflow-hidden ${oppGlow}`}>
                <div className="flex items-center gap-2 flex-row-reverse">
                  <PlayerAvatar symbol={oppSymbol} />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[11px] sm:text-[12px] font-semibold text-white truncate">{opponent?.name ?? 'Waiting...'}</p>
                    {!opponent && room?.status === 'waiting' && (
                      <p className="text-[9px] sm:text-[10px] text-amber-400/70 font-medium mt-0.5">Code: {room?.code}</p>
                    )}
                    {oppReady && !amReady && (room?.status === 'won' || room?.status === 'tie') && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-[9px] sm:text-[10px] text-amber-400/80 font-medium mt-0.5">
                        Ready to rematch!
                      </motion.p>
                    )}
                    {isOppTurn && opponent && room?.turnStartTime && (
                      <TurnTimerBar turnStartTime={room.turnStartTime} symbol={oppSymbol} />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <AnimatePresence>
                    {oppBubbles.map((b) => (
                      <StackedBubble key={b.id} bubble={b} align="left" symbol={oppSymbol} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-4 pb-3 sm:px-6 sm:pb-4 md:px-8 pointer-events-none">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <div className="pointer-events-auto rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2">
            <div>
              <p className="text-[7px] sm:text-[8px] text-white/25 uppercase tracking-widest">Room</p>
              <p className="text-xs sm:text-sm font-bold text-white tracking-[0.2em]">{room?.code}</p>
            </div>
            <button onClick={handleCopyCode} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 transition-all" title="Copy room code">
              {codeCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
            <button onClick={handleShare} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 transition-all" title="Share link">
              {shareCopied ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
            </button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <button onClick={() => { soundManager.playClick(); const next = !muted; setMuted(next); soundManager.setMuted(next) }} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <div className="relative">
              <button onClick={() => { soundManager.playClick(); setChatOpen(!chatOpen) }} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
                <MessageCircle size={14} />
              </button>
              <QuickChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
            </div>
            <button onClick={() => { soundManager.playClick(); setDrawerOpen(true) }} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            </button>
            <button onClick={handleExit} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-rose-400/20 bg-rose-400/10 backdrop-blur-xl flex items-center justify-center text-rose-400/60 hover:text-rose-400 hover:bg-rose-400/20 transition-colors" title="Exit Game">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* WAITING OVERLAY */}
      {room?.status === 'waiting' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl px-6 py-8 sm:px-8 sm:py-10 text-center max-w-sm w-full mx-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-amber-400/10 border border-amber-400/15 flex items-center justify-center">
              <Trophy size={24} className="text-amber-400 sm:hidden" />
              <Trophy size={28} className="text-amber-400 hidden sm:block" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Waiting for opponent</h2>
            <p className="text-xs sm:text-sm text-white/40 mb-5 sm:mb-6">Share this code with your friend:</p>
            <div className="rounded-xl bg-white/[0.06] border border-white/[0.08] px-5 py-3 sm:px-6 sm:py-4 mb-3">
              <p className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-[0.3em]">{room?.code}</p>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={handleCopyCode} className="flex-1 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-xs font-medium flex items-center justify-center gap-2 hover:bg-white/[0.1] transition-all">
                {codeCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {codeCopied ? 'Copied!' : 'Copy Code'}
              </button>
              <button onClick={handleShare} className="flex-1 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-xs font-medium flex items-center justify-center gap-2 hover:bg-white/[0.1] transition-all">
                {shareCopied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                {shareCopied ? 'Copied!' : 'Share Link'}
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-white/25 mb-4">Expires in 5 minutes if not joined</p>
            <button onClick={handleExit} className="w-full h-11 rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-400 text-sm font-semibold hover:bg-rose-400/20 transition-all flex items-center justify-center gap-2">
              <LogOut size={15} />
              Cancel & Exit
            </button>
          </div>
        </motion.div>
      )}

      {/* WIN/LOSE/TIE OVERLAY */}
      <AnimatePresence>
        {useGameStore.getState().showResult && (room?.status === 'won' || room?.status === 'tie') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl px-6 py-8 sm:px-8 sm:py-10 text-center max-w-sm w-full mx-4">
              {room?.status === 'tie' ? (
                <>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">🤝</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">It&apos;s a Tie!</h2>
                </>
              ) : room?.winner === playerId ? (
                <>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-cyan-400/10 border border-cyan-400/15 flex items-center justify-center">
                    <Trophy size={24} className="text-cyan-400 sm:hidden" />
                    <Trophy size={28} className="text-cyan-400 hidden sm:block" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-1">You Win!</h2>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-rose-400/10 border border-rose-400/15 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">😔</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-rose-400 mb-1">You Lose</h2>
                </>
              )}

              <div className="mt-6">
                {rematchTimeLeft !== null && rematchTimeLeft > 0 && (
                  <div className="mb-4">
                    <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-rose-400" style={{ width: `${timerPct}%` }} transition={{ duration: 0.1 }} />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-white/30 mt-2">
                      {Math.ceil(rematchTimeLeft / 1000)}s remaining
                    </p>
                  </div>
                )}

                {amReady && !oppReady && rematchTimeLeft !== null && rematchTimeLeft > 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-amber-400/80 mb-3">
                    Waiting for opponent to accept...
                  </motion.p>
                )}

                <button onClick={handleReady} disabled={amReady} className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-2 ${amReady ? 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-400/50 cursor-default' : 'bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/25'}`}>
                  <RotateCcw size={15} />
                  {amReady ? 'Waiting for opponent...' : 'Play Again'}
                </button>

                {amReady && !oppReady && rematchTimeLeft !== null && rematchTimeLeft <= 0 && (
                  <p className="text-xs text-amber-400 mt-2">Rematch timed out!</p>
                )}

                <button onClick={handleExit} className="w-full h-10 rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/40 text-xs font-medium hover:bg-white/[0.08] hover:text-white/60 transition-all flex items-center justify-center gap-2 mt-2">
                  <LogOut size={13} />
                  Exit to Menu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}

function TurnTimerBar({ turnStartTime, symbol }: { turnStartTime: number; symbol: 'X' | 'O' }) {
  const [pct, setPct] = useState(100)

  useEffect(() => {
    let raf: number
    const tick = () => {
      const elapsed = Date.now() - turnStartTime
      const remaining = Math.max(0, TURN_TIME_LIMIT - elapsed)
      setPct((remaining / TURN_TIME_LIMIT) * 100)
      if (remaining > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [turnStartTime])

  return (
    <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-none"
        style={{
          width: `${pct}%`,
          backgroundColor: pct > 50 ? (symbol === 'X' ? '#22d3ee' : '#f43f5e')
            : pct > 20 ? '#FBBF24'
            : '#EF4444',
        }}
      />
    </div>
  )
}
