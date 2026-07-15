'use client'

import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import { setReady, deleteRoom } from '@/lib/firebase'
import { TURN_TIME_LIMIT } from '@/lib/types'
import { Trophy, Volume2, VolumeX, RotateCcw, MessageCircle, LogOut, Copy, Share2, Check, Maximize } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import QuickChat from './QuickChat'
import ChatDrawer from './ChatDrawer'
import { EmojiIcon } from './QuickChat'
import type { ChatBubble } from '@/lib/types'

const REMATCH_TIMEOUT = 30_000
const EMOJI_IDS = ['laugh', 'clown', 'angry', 'cry', 'shock']

function requestFullscreen() {
  try {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen()
    else if ((el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) (el as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen()
    else if ((el as unknown as { mozRequestFullScreen?: () => void }).mozRequestFullScreen) (el as unknown as { mozRequestFullScreen: () => void }).mozRequestFullScreen()
    else if ((el as unknown as { msRequestFullscreen?: () => void }).msRequestFullscreen) (el as unknown as { msRequestFullscreen: () => void }).msRequestFullscreen()
  } catch {}
}

function MiniAvatar({ symbol }: { symbol: 'X' | 'O' }) {
  return (
    <div
      className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0"
      style={{
        background: '#3a2517',
        border: '1px solid #5c3a21',
        color: '#e1c699',
        textShadow: '0 1px 1px rgba(0,0,0,0.4)',
      }}
    >
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
          ? 'bg-[#8b6508]/20 border-[#8b6508]/30'
          : 'bg-white/[0.06] border-white/[0.08]'
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

  const isMyTurn = room?.turn === playerId && room?.status === 'playing'

  const mySymbol = useMemo(() => {
    if (!room || !playerId) return 'X'
    return room.players?.p1?.id === playerId ? 'X' : 'O'
  }, [room, playerId])
  const oppSymbol = mySymbol === 'X' ? 'O' : 'X'

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
  const amReady = !!(room?.ready && room.ready[playerId])
  const oppReady = !!(room?.ready && playerId && room.ready[Object.keys(room.ready).find((k) => k !== playerId) ?? ''])
  const timerPct = rematchTimeLeft !== null ? (rematchTimeLeft / REMATCH_TIMEOUT) * 100 : 0

  return (
    <>
      {/* BACK BUTTON */}
      <button
        onClick={handleExit}
        className="fixed top-4 left-4 z-30 pointer-events-auto w-10 h-10 rounded-xl flex items-center justify-center text-[#8b6508] hover:text-[#c4a35a] transition-all"
        style={{
          background: 'linear-gradient(to bottom, #2b1d14, #1a120d)',
          border: '1.5px solid #3a2612',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
        title="Exit to Menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      </button>

      {/* Floating chat bubbles — positioned above the board */}
      {(myBubbles.length > 0 || oppBubbles.length > 0) && (
        <div className="fixed top-20 right-4 z-20 flex flex-col gap-1 pointer-events-none max-w-[180px]">
          <AnimatePresence>
            {oppBubbles.map((b) => (
              <StackedBubble key={b.id} bubble={b} align="left" symbol={oppSymbol} />
            ))}
            {myBubbles.map((b) => (
              <StackedBubble key={b.id} bubble={b} align="right" symbol={mySymbol} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* BOTTOM BAR — aligned to board width */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-4 pointer-events-none" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}>
        <div className="mx-auto max-w-[380px]">
          <div
            className="pointer-events-auto rounded-xl px-3 py-2 flex items-center justify-between"
            style={{
              background: 'linear-gradient(to bottom, #2b1d14, #1a120d)',
              border: '1.5px solid #3a2612',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[7px] sm:text-[8px] text-[#6b4a1e] uppercase tracking-widest">Room</p>
                <p className="text-xs sm:text-sm font-bold text-[#c4a35a] tracking-[0.2em]">{room?.code}</p>
              </div>
              <button onClick={handleCopyCode} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#8b6508]/60 hover:text-[#c4a35a] transition-all" style={{ background: 'rgba(139,101,8,0.1)', border: '1px solid rgba(139,101,8,0.2)' }} title="Copy room code">
                {codeCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
              <button onClick={handleShare} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#8b6508]/60 hover:text-[#c4a35a] transition-all" style={{ background: 'rgba(139,101,8,0.1)', border: '1px solid rgba(139,101,8,0.2)' }} title="Share link">
                {shareCopied ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[
                { icon: muted ? <VolumeX size={14} /> : <Volume2 size={14} />, onClick: () => { soundManager.playClick(); const next = !muted; setMuted(next); soundManager.setMuted(next) }, title: 'Sound' },
                { icon: <Maximize size={14} />, onClick: () => { soundManager.playClick(); requestFullscreen() }, title: 'Fullscreen' },
                { icon: <MessageCircle size={14} />, onClick: () => { soundManager.playClick(); setChatOpen(!chatOpen) }, title: 'Chat', isChat: true },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>, onClick: () => { soundManager.playClick(); setDrawerOpen(true) }, title: 'Messages' },
              ].map((btn, i) => (
                <div key={i} className="relative">
                  <button
                    onClick={btn.onClick}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#8b6508]/50 hover:text-[#c4a35a] transition-colors"
                    style={{
                      background: 'linear-gradient(to bottom, #2b1d14, #1a120d)',
                      border: '1.5px solid #3a2612',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                    title={btn.title}
                  >
                    {btn.icon}
                  </button>
                  {btn.isChat && <QuickChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />}
                </div>
              ))}
              <button
                onClick={handleExit}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-rose-400/50 hover:text-rose-400 transition-colors"
                style={{
                  background: 'linear-gradient(to bottom, rgba(120,30,30,0.3), rgba(80,20,20,0.3))',
                  border: '1.5px solid rgba(220,80,80,0.2)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
                title="Exit Game"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WAITING OVERLAY */}
      {room?.status === 'waiting' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div
            className="rounded-[1.5rem] overflow-hidden px-6 py-8 sm:px-8 sm:py-10 text-center max-w-sm w-full mx-4"
            style={{
              background: 'linear-gradient(to bottom, #2b1d14, #1a120d)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.3)',
              border: '3px solid #3a2612',
            }}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(218,165,32,0.15), rgba(139,101,8,0.1))', border: '1.5px solid rgba(139,101,8,0.25)' }}>
              <Trophy size={24} className="text-[#c4a35a] sm:hidden" />
              <Trophy size={28} className="text-[#c4a35a] hidden sm:block" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#c4a35a] mb-2">Waiting for opponent</h2>
            <p className="text-xs sm:text-sm text-white/40 mb-5 sm:mb-6">Share this code with your friend:</p>
            <div
              className="rounded-xl px-5 py-3 sm:px-6 sm:py-4 mb-3"
              style={{
                background: 'linear-gradient(to bottom, #3b2a1a, #1f150d)',
                border: '1.5px solid #5c3a21',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)',
              }}
            >
              <p className="text-2xl sm:text-3xl font-mono font-bold text-[#c4a35a] tracking-[0.3em]">{room?.code}</p>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={handleCopyCode} className="flex-1 h-10 rounded-xl text-[#c4a35a] text-xs font-medium flex items-center justify-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, rgba(139,101,8,0.2), rgba(92,64,8,0.15))', border: '1px solid rgba(139,101,8,0.25)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {codeCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {codeCopied ? 'Copied!' : 'Copy Code'}
              </button>
              <button onClick={handleShare} className="flex-1 h-10 rounded-xl text-[#c4a35a] text-xs font-medium flex items-center justify-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, rgba(139,101,8,0.2), rgba(92,64,8,0.15))', border: '1px solid rgba(139,101,8,0.25)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {shareCopied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                {shareCopied ? 'Copied!' : 'Share Link'}
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-white/25 mb-4">Expires in 5 minutes if not joined</p>
            <button onClick={handleExit} className="w-full h-11 rounded-xl text-rose-400 text-sm font-semibold hover:bg-rose-400/20 transition-all flex items-center justify-center gap-2" style={{ background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.2)' }}>
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
            <div
              className="rounded-[1.5rem] overflow-hidden px-6 py-8 sm:px-8 sm:py-10 text-center max-w-sm w-full mx-4"
              style={{
                background: 'linear-gradient(to bottom, #2b1d14, #1a120d)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.3)',
                border: '3px solid #3a2612',
              }}
            >
              {room?.status === 'tie' ? (
                <>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-[#8b6508]/10 border border-[#8b6508]/20 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">🤝</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#d4a853] mb-1">It&apos;s a Tie!</h2>
                </>
              ) : room?.winner === playerId ? (
                <>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-[#ffd700]/10 border border-[#ffd700]/20 flex items-center justify-center">
                    <Trophy size={24} className="text-[#ffd700] sm:hidden" />
                    <Trophy size={28} className="text-[#ffd700] hidden sm:block" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#ffd700] mb-1">You Win!</h2>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-[#c0c0c0]/10 border border-[#c0c0c0]/20 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">😔</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#c0c0c0] mb-1">You Lose</h2>
                </>
              )}

              <div className="mt-6">
                {rematchTimeLeft !== null && rematchTimeLeft > 0 && (
                  <div className="mb-4">
                    <div className="w-full h-1.5 rounded-full bg-[#5c3a21]/30 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#ffd700] to-[#8b6508]" style={{ width: `${timerPct}%` }} />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-white/30 mt-2">
                      {Math.ceil(rematchTimeLeft / 1000)}s remaining
                    </p>
                  </div>
                )}

                {amReady && !oppReady && rematchTimeLeft !== null && rematchTimeLeft > 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-xs text-[#d4a853]/70 mb-3">
                    Waiting for opponent to accept...
                  </motion.p>
                )}

                <button onClick={handleReady} disabled={amReady} className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-2 ${amReady ? 'bg-[#8b6508]/15 border border-[#8b6508]/25 text-[#d4a853]/50 cursor-default' : 'bg-[#8b6508]/20 border border-[#8b6508]/30 text-[#d4a853] hover:bg-[#8b6508]/30'}`}>
                  <RotateCcw size={15} />
                  {amReady ? 'Waiting for opponent...' : 'Play Again'}
                </button>

                {amReady && !oppReady && rematchTimeLeft !== null && rematchTimeLeft <= 0 && (
                  <p className="text-xs text-[#d4a853] mt-2">Rematch timed out!</p>
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
