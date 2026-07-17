'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import {
  Gamepad2, ArrowRight, ArrowLeft, X,
  ClipboardPaste, Check, Lock, Sparkles,
  Trophy, Star, Settings, Swords, Users,
} from 'lucide-react'

type Stage = 'WELCOME' | 'CATALOG' | 'XO_SETUP'
type JoinMode = false | 'tap' | 'input'

function tryFullscreen() {
  try {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen()
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen()
    else if ((el as any).mozRequestFullScreen) (el as any).mozRequestFullScreen()
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen()
  } catch {}
}

const GAMES = [
  {
    id: 'xo',
    title: 'XO Arena',
    sub: 'Multiverse Duel',
    live: true,
    gradient: 'from-[#f59e0b] to-[#ef4444]',
    shadow: '#92400e',
    icon: (
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
        <line x1="22" y1="22" x2="78" y2="78" stroke="url(#g1)" strokeWidth="12" strokeLinecap="round" />
        <line x1="78" y1="22" x2="22" y2="78" stroke="url(#g1)" strokeWidth="12" strokeLinecap="round" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="url(#g2)" strokeWidth="10" />
      </svg>
    ),
  },
  {
    id: 'chess',
    title: 'Chess Royale',
    sub: 'Grandmaster Duel',
    live: false,
    gradient: 'from-[#6366f1] to-[#8b5cf6]',
    shadow: '#4338ca',
    icon: (
      <svg viewBox="0 0 100 100" className="w-20 h-20 opacity-50">
        <defs>
          <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d="M40 75 C40 75 36 62 40 54 C44 46 40 38 48 34 C56 30 64 34 64 42 C64 50 60 54 60 58 L64 66 L64 75 Z" fill="url(#g3)" />
        <rect x="35" y="75" width="30" height="6" rx="2" fill="url(#g3)" />
      </svg>
    ),
  },
  {
    id: 'cards',
    title: 'Cards Arena',
    sub: 'Poker Master',
    live: false,
    gradient: 'from-[#ec4899] to-[#a855f7]',
    shadow: '#831843',
    icon: (
      <svg viewBox="0 0 100 100" className="w-20 h-20 opacity-50">
        <defs>
          <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <rect x="30" y="16" width="40" height="68" rx="6" fill="none" stroke="url(#g4)" strokeWidth="4" />
        <path d="M50 34 C44 40 38 46 44 52 C50 58 50 58 50 58 C50 58 50 58 56 52 C62 46 56 40 50 34 Z" fill="url(#g4)" />
        <path d="M48 60 L52 60 L54 68 L46 68 Z" fill="url(#g4)" />
      </svg>
    ),
  },
]

export default function PlayOnline() {
  const router = useRouter()
  const { playerName, setPlayerName, setPlayerId } = useGameStore()

  const [stage, setStage] = useState<Stage>('WELCOME')
  const [name, setName] = useState(playerName || '')
  const [joinMode, setJoinMode] = useState<JoinMode>(false)
  const [joinCode, setJoinCode] = useState('')
  const [pasteOk, setPasteOk] = useState(false)
  const [deepRoom, setDeepRoom] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('room')
    if (p) setDeepRoom(p.trim().toUpperCase())
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('xo playerName')
    let id = localStorage.getItem('xo playerId')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('xo playerId', id)
    }
    setPlayerId(id)
    if (saved?.trim()) {
      setPlayerName(saved)
      setName(saved)
      setStage('CATALOG')
    }
    setReady(true)
  }, [setPlayerName, setPlayerId])

  useEffect(() => {
    if (deepRoom && ready) {
      const saved = localStorage.getItem('xo playerName')
      if (saved?.trim()) {
        soundManager.playClick()
        tryFullscreen()
        router.push(`/room/${deepRoom}`)
      }
    }
  }, [deepRoom, ready, router])

  const confirmName = useCallback(() => {
    const t = name.trim()
    if (!t) return
    soundManager.playClick()
    setPlayerName(t)
    localStorage.setItem('xo playerName', t)
    setStage('CATALOG')
  }, [name, setPlayerName])

  const goCreate = () => {
    soundManager.playClick()
    tryFullscreen()
    router.push('/room/create')
  }

  const goJoin = () => {
    if (joinCode.trim().length < 4) return
    soundManager.playClick()
    tryFullscreen()
    router.push(`/room/${joinCode.trim().toUpperCase()}`)
  }

  const paste = useCallback(async () => {
    try {
      const t = await navigator.clipboard.readText()
      setJoinCode(t.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))
      setPasteOk(true)
      setTimeout(() => setPasteOk(false), 1500)
    } catch {}
  }, [])

  if (!ready) return null

  /* ════════════ DEEP LINK NAME ENTRY ════════════ */
  if (deepRoom && !localStorage.getItem('xo playerName')) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center px-5"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>

        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[120px] opacity-[0.08] bg-[#3b82f6] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center">

          <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center mb-5 shadow-[0_6px_0_#14532d,0_10px_25px_rgba(0,0,0,0.4)]">
            <Gamepad2 size={36} className="text-white" />
          </div>

          <h1 className="text-4xl font-black text-white mb-1" style={{ textShadow: '0 4px 0 rgba(0,0,0,0.5)' }}>
            Play<span className="text-[#fbbf24]">Online</span>
          </h1>
          <p className="text-sm font-bold text-white/50 mb-8">Joining room <span className="text-[#22c55e]">{deepRoom}</span></p>

          <div className="w-full bg-[#1e293b] rounded-[1.75rem] p-6 border-[3px] border-[#334155] shadow-[0_8px_0_#141c2b,0_12px_40px_rgba(0,0,0,0.5)]">
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmName()}
              placeholder="Your name" maxLength={15} autoFocus
              className="w-full bg-[#0b1120] border-[3px] border-[#3b82f6] rounded-full text-center text-lg text-white font-bold py-3.5 px-5 focus:outline-none focus:ring-4 focus:ring-blue-400/30 placeholder:text-white/20 mb-4" />
            <button onClick={confirmName} disabled={!name.trim()}
              className="w-full py-3.5 bg-[#fbbf24] text-[#422006] font-black text-base uppercase tracking-wider rounded-2xl border-b-[5px] border-[#d97706] active:border-b-0 active:translate-y-[5px] transition-all shadow-[0_5px_0_#d97706] disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed">
              Let's Play!
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden relative"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[150px] opacity-[0.07] bg-[#8b5cf6]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full blur-[130px] opacity-[0.06] bg-[#06b6d4]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.04] bg-[#fbbf24]" />

      <AnimatePresence mode="wait">
        {/* ════════════ WELCOME ════════════ */}
        {stage === 'WELCOME' && (
          <motion.div key="w" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -80 }} transition={{ duration: 0.35, type: 'spring', bounce: 0.3 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">

            <motion.div animate={{ y: [0, -14, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-[1.75rem] bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center mb-6 shadow-[0_8px_0_#92400e,0_14px_35px_rgba(0,0,0,0.5)]">
              <Gamepad2 size={46} className="text-white" />
            </motion.div>

            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
              className="text-[3.5rem] leading-none font-black text-white mb-1 select-none"
              style={{ textShadow: '0 5px 0 rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3)' }}>
              Play<span className="text-[#fbbf24]">Online</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-sm font-bold text-white/40 mb-10">The ultimate multi-game hub</motion.p>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
              className="w-full max-w-xs mb-5">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && confirmName()}
                placeholder="Enter your name..." maxLength={15} autoFocus
                className="w-full bg-[#0b1120]/60 border-[4px] border-[#3b82f6] rounded-full text-center text-xl text-white font-bold py-4 px-6 focus:outline-none focus:ring-4 focus:ring-blue-400/30 placeholder:text-white/20 transition-all" />
            </motion.div>

            <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={confirmName} disabled={!name.trim()}
              className="w-full max-w-xs py-5 bg-[#fbbf24] text-[#422006] font-black text-2xl uppercase tracking-widest rounded-2xl border-b-[6px] border-[#d97706] active:border-b-0 active:translate-y-[6px] transition-all shadow-[0_6px_0_#d97706,0_12px_30px_rgba(0,0,0,0.3)] disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed">
              PLAY
            </motion.button>
          </motion.div>
        )}

        {/* ════════════ CATALOG ════════════ */}
        {stage === 'CATALOG' && (
          <motion.div key="c" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }} transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
            className="relative z-10 flex-1 flex flex-col overflow-hidden">

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2.5 shrink-0 bg-[#0b1120]/70 backdrop-blur-md border-b-[3px] border-[#1e293b]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] border-[3px] border-[#a78bfa] flex items-center justify-center text-white font-black text-lg shadow-[0_4px_0_#4c1d95]">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[9px] text-white/30 font-extrabold uppercase tracking-widest">Player</p>
                  <p className="text-sm font-black text-white truncate max-w-[110px]">{name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#1e293b] border-2 border-[#334155] rounded-full px-3 py-1.5 shadow-[0_3px_0_#0f172a]">
                  <Star size={13} className="text-[#fbbf24] fill-[#fbbf24]" />
                  <span className="text-xs font-black text-[#fbbf24]">0</span>
                </div>
                <button onClick={() => { soundManager.playClick(); setStage('WELCOME') }}
                  className="w-9 h-9 rounded-full bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center text-white/40 hover:text-white transition-colors shadow-[0_3px_0_#0f172a]">
                  <Settings size={15} />
                </button>
              </div>
            </div>

            {/* Scrollable game list */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2"
                style={{ textShadow: '0 2px 0 rgba(0,0,0,0.4)' }}>
                <Sparkles size={22} className="text-[#fbbf24]" />
                Choose Your Game
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-8">
                {GAMES.map(g => (
                  <div key={g.id}
                    className="rounded-[1.5rem] border-[3px] border-[#334155] p-4 flex flex-col justify-between relative overflow-hidden shadow-[0_8px_0_#141c2b,0_10px_30px_rgba(0,0,0,0.4)]"
                    style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>

                    {g.live && <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#fbbf24]/[0.06] blur-3xl pointer-events-none" />}

                    <div>
                      <div className={`w-full h-36 rounded-2xl bg-gradient-to-br ${g.gradient} flex items-center justify-center mb-3 shadow-[0_4px_0_${g.shadow}]`}>
                        {g.icon}
                      </div>
                      <h3 className="text-lg font-black text-white" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.4)' }}>{g.title}</h3>
                      <p className="text-[10px] font-extrabold text-[#fbbf24] uppercase tracking-widest">{g.sub}</p>
                    </div>

                    <div className="mt-4">
                      {g.live ? (
                        <button onClick={() => { soundManager.playClick(); setStage('XO_SETUP'); setJoinMode(false); setJoinCode('') }}
                          className="w-full py-3.5 bg-[#fbbf24] text-[#422006] font-black text-sm uppercase tracking-wider rounded-xl border-b-[5px] border-[#d97706] active:border-b-0 active:translate-y-[5px] transition-all shadow-[0_4px_0_#d97706] flex items-center justify-center gap-2">
                          Play Now <ArrowRight size={15} />
                        </button>
                      ) : (
                        <button disabled
                          className="w-full py-3.5 bg-[#334155] text-white/20 font-black text-sm uppercase tracking-wider rounded-xl border-b-[5px] border-[#1e293b] cursor-not-allowed flex items-center justify-center gap-2">
                          <Lock size={13} /> Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold text-white/20 border-t-[3px] border-[#1e293b] shrink-0">
              <Trophy size={11} className="text-[#fbbf24]/50" />
              Compete with friends worldwide
            </div>
          </motion.div>
        )}

        {/* ════════════ XO SETUP ════════════ */}
        {stage === 'XO_SETUP' && (
          <motion.div key="x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 flex-1 flex items-center justify-center px-4">

            {/* Blurred backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-[#0b1120]/85 backdrop-blur-md"
              onClick={() => { soundManager.playClick(); setStage('CATALOG') }} />

            {/* Glassmorphic modal */}
            <motion.div initial={{ scale: 0.6, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
              className="relative z-10 w-[92%] max-w-sm rounded-[1.75rem] p-6 border-[3px] border-[#94a3b8]/20 shadow-[0_10px_0_#1e293b,0_20px_50px_rgba(0,0,0,0.6)]"
              style={{ background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)' }}>

              {/* Close */}
              <button onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#334155] border-2 border-[#475569] flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <X size={13} />
              </button>

              {/* Icon + Title */}
              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-[1.25rem] bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-[0_5px_0_#92400e] border-b-[4px] border-[#92400e]">
                  <Gamepad2 size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-white" style={{ textShadow: '0 3px 0 rgba(0,0,0,0.4)' }}>XO Arena</h2>
                <p className="text-xs font-bold text-white/40 mt-1">How do you want to play?</p>
              </div>

              {/* Player badge */}
              <div className="flex items-center gap-3 mb-5 bg-[#0b1120]/60 rounded-2xl border-2 border-[#334155] p-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] border-[3px] border-[#a78bfa] flex items-center justify-center text-white font-black text-sm shadow-[0_3px_0_#4c1d95]">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] text-white/30 font-extrabold uppercase tracking-widest">Playing as</p>
                  <p className="text-sm font-black text-white truncate">{name}</p>
                </div>
                <button onClick={() => { soundManager.playClick(); setStage('WELCOME') }}
                  className="text-[10px] font-bold text-white/30 hover:text-[#fbbf24] transition-colors px-2 py-1 rounded-lg">
                  Change
                </button>
              </div>

              {/* Create Match — Gold 3D */}
              <button onClick={goCreate}
                className="w-full py-4 bg-[#fbbf24] text-[#422006] font-black text-base uppercase tracking-wider rounded-2xl border-b-[6px] border-[#d97706] active:border-b-0 active:translate-y-[6px] transition-all shadow-[0_6px_0_#d97706,0_8px_20px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 mb-3">
                <Swords size={20} />
                Create Match
              </button>

              {/* Join Match — Blue 3D */}
              <button onClick={() => { soundManager.playClick(); setJoinMode(joinMode === false ? 'tap' : false) }}
                className="w-full py-4 bg-[#3b82f6] text-white font-black text-base uppercase tracking-wider rounded-2xl border-b-[6px] border-[#2563eb] active:border-b-0 active:translate-y-[6px] transition-all shadow-[0_6px_0_#2563eb,0_8px_20px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3">
                <Users size={20} />
                Join Match
              </button>

              {/* Join code reveal */}
              {joinMode === 'tap' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden">
                  <div className="mt-4 pt-4 border-t-2 border-[#334155]/50">
                    <p className="text-[10px] font-extrabold text-white/30 uppercase tracking-widest text-center mb-2">Enter room code</p>
                    <div className="relative mb-3">
                      <input type="text" value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && goJoin()}
                        placeholder="CODE" maxLength={8} autoFocus
                        className="w-full bg-[#0b1120] border-[3px] border-[#3b82f6] rounded-2xl text-center text-2xl text-white font-black py-3 px-5 tracking-[0.35em] focus:outline-none focus:ring-4 focus:ring-blue-400/25 placeholder:text-white/15 transition-all" />
                      <button onClick={paste}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center text-white/30 hover:text-[#fbbf24] transition-colors">
                        {pasteOk ? <Check size={14} className="text-[#22c55e]" /> : <ClipboardPaste size={14} />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { soundManager.playClick(); setJoinMode(false); setJoinCode('') }}
                        className="flex-1 py-3 bg-[#334155] text-white/50 font-black text-sm uppercase tracking-wider rounded-xl border-b-[4px] border-[#1e293b] active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-1">
                        <ArrowLeft size={13} /> Back
                      </button>
                      <button onClick={goJoin} disabled={joinCode.trim().length < 4}
                        className="flex-1 py-3 bg-[#22c55e] text-white font-black text-sm uppercase tracking-wider rounded-xl border-b-[4px] border-[#16a34a] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#16a34a] disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        Join <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
