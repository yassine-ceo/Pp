'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import {
  Gamepad2,
  Plus,
  LogIn,
  ArrowRight,
  ArrowLeft,
  Settings,
  X,
  ClipboardPaste,
  Check,
  Lock,
  Sparkles,
  Trophy,
  Sword,
  Handshake,
  Star,
} from 'lucide-react'

type PlatformStage = 'WELCOME_SCREEN' | 'GAME_CATALOG' | 'IN_GAME_XO'

function tryFullscreen() {
  try {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen()
    else if ((el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) (el as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen()
    else if ((el as unknown as { mozRequestFullScreen?: () => void }).mozRequestFullScreen) (el as unknown as { mozRequestFullScreen: () => void }).mozRequestFullScreen()
    else if ((el as unknown as { msRequestFullscreen?: () => void }).msRequestFullscreen) (el as unknown as { msRequestFullscreen: () => void }).msRequestFullscreen()
  } catch {}
}

export default function PlayOnlinePlatform() {
  const router = useRouter()
  const { playerName, setPlayerName, setPlayerId } = useGameStore()

  const [stage, setStage] = useState<PlatformStage>('WELCOME_SCREEN')
  const [name, setName] = useState(playerName || '')
  const [joinCode, setJoinCode] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [pasteSuccess, setPasteSuccess] = useState(false)
  const [deepLinkRoom, setDeepLinkRoom] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = params.get('room')
    if (room) setDeepLinkRoom(room.trim().toUpperCase())
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('xo playerName')
    if (saved && saved.trim()) {
      setPlayerName(saved)
      setName(saved)
      setNameConfirmed(true)
      setStage('GAME_CATALOG')
    }
    let id = localStorage.getItem('xo playerId')
    if (!id) {
      try { id = crypto.randomUUID() } catch { id = Math.random().toString(36).slice(2) + Date.now().toString(36) }
      localStorage.setItem('xo playerId', id)
    }
    setPlayerId(id)
  }, [setPlayerName, setPlayerId])

  useEffect(() => {
    if (deepLinkRoom && nameConfirmed) {
      soundManager.playClick()
      tryFullscreen()
      router.push(`/room/${deepLinkRoom}`)
    }
  }, [deepLinkRoom, nameConfirmed, router])

  const handleNameConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    soundManager.playClick()
    setPlayerName(trimmed)
    try { localStorage.setItem('xo playerName', trimmed) } catch {}
    let id = localStorage.getItem('xo playerId')
    if (!id) {
      try { id = crypto.randomUUID() } catch { id = Math.random().toString(36).slice(2) + Date.now().toString(36) }
      localStorage.setItem('xo playerId', id)
      setPlayerId(id)
    }
    setNameConfirmed(true)
    setStage('GAME_CATALOG')
  }

  const handleCreate = () => {
    if (!nameConfirmed) return
    soundManager.playClick()
    tryFullscreen()
    router.push('/room/create')
  }

  const handleJoin = () => {
    if (!nameConfirmed || joinCode.trim().length < 4) return
    soundManager.playClick()
    tryFullscreen()
    router.push(`/room/${joinCode.trim().toUpperCase()}`)
  }

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      const cleaned = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
      setJoinCode(cleaned)
      setPasteSuccess(true)
      setTimeout(() => setPasteSuccess(false), 1500)
    } catch {}
  }, [])

  const gamesList = [
    {
      id: 'xo',
      title: 'XO Arena',
      subtitle: 'Multiverse Duel',
      available: true,
      renderEmblem: () => (
        <div className="relative w-full h-40 flex items-center justify-center bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-2xl border-4 border-[#334155] mb-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ffc107]/[0.06] to-transparent pointer-events-none" />
          <svg viewBox="0 0 120 120" className="w-32 h-32 drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]">
            <defs>
              <linearGradient id="gold3d" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF1C5" />
                <stop offset="30%" stopColor="#ffc107" />
                <stop offset="70%" stopColor="#e6a800" />
                <stop offset="100%" stopColor="#8b6914" />
              </linearGradient>
              <linearGradient id="silver3d" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#c0c0c0" />
                <stop offset="100%" stopColor="#6b6b6b" />
              </linearGradient>
              <filter id="glow3d">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <line x1="28" y1="28" x2="92" y2="92" stroke="url(#gold3d)" strokeWidth="16" strokeLinecap="round" filter="url(#glow3d)" />
            <circle cx="60" cy="60" r="24" fill="none" stroke="url(#silver3d)" strokeWidth="14" filter="url(#glow3d)" />
            <line x1="92" y1="28" x2="28" y2="92" stroke="url(#gold3d)" strokeWidth="16" strokeLinecap="round" filter="url(#glow3d)" />
          </svg>
        </div>
      )
    },
    {
      id: 'chess',
      title: 'Chess Royale',
      subtitle: 'Grandmaster Duel',
      available: false,
      renderEmblem: () => (
        <div className="relative w-full h-40 flex items-center justify-center bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-2xl border-4 border-[#334155] mb-4 overflow-hidden opacity-40">
          <svg viewBox="0 0 120 120" className="w-28 h-28 drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]">
            <defs>
              <linearGradient id="chess3d" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <path d="M45 85 C45 85 40 70 45 60 C50 50 45 40 55 35 C65 30 75 35 75 45 C75 55 70 60 70 65 L75 75 L75 85 Z" fill="url(#chess3d)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <rect x="40" y="85" width="40" height="8" rx="3" fill="url(#chess3d)" />
          </svg>
        </div>
      )
    },
    {
      id: 'cards',
      title: 'Cards Arena',
      subtitle: 'Poker Master',
      available: false,
      renderEmblem: () => (
        <div className="relative w-full h-40 flex items-center justify-center bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-2xl border-4 border-[#334155] mb-4 overflow-hidden opacity-40">
          <svg viewBox="0 0 120 120" className="w-28 h-28 drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]">
            <defs>
              <linearGradient id="card3d" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <rect x="35" y="20" width="50" height="80" rx="8" fill="none" stroke="url(#card3d)" strokeWidth="4" />
            <path d="M60 40 C52 48 44 56 52 64 C60 72 60 72 60 72 C60 72 60 72 68 64 C76 56 68 48 60 40 Z" fill="url(#card3d)" />
            <path d="M57 70 L63 70 L65 80 L55 80 Z" fill="url(#card3d)" />
          </svg>
        </div>
      )
    }
  ]

  // Deep-link name entry
  if (deepLinkRoom && !nameConfirmed) {
    return (
      <div className="min-h-screen h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] text-white px-6 overflow-hidden relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.08] blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center"
        >
          <div className="w-24 h-24 mb-6 rounded-[2rem] bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center shadow-[0_8px_0_#15803d,0_12px_30px_rgba(0,0,0,0.4)] border-b-[6px] border-[#15803d]">
            <Gamepad2 size={40} className="text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]" />
          </div>
          <h1 className="text-4xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] mb-2 tracking-wide">PlayOnline</h1>
          <p className="text-sm text-white/60 font-bold mb-8">Joining room <span className="text-[#22c55e] font-black">{deepLinkRoom}</span></p>

          <div className="w-full bg-[#1e293b] rounded-3xl border-4 border-[#334155] p-6 shadow-[0_8px_0_#1a2436,0_12px_40px_rgba(0,0,0,0.5)]">
            <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3 text-center">Choose your name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
              placeholder="Username..."
              maxLength={15}
              autoFocus
              className="w-full bg-[#0f172a]/60 border-4 border-[#3b82f6] rounded-full text-center text-xl text-white font-bold py-4 px-6 focus:outline-none focus:ring-4 focus:ring-blue-400/40 placeholder:text-white/25 transition-all mb-5"
            />
            <button
              onClick={handleNameConfirm}
              disabled={!name.trim()}
              className="w-full py-4 px-6 bg-[#ffc107] text-[#5c3a21] font-black text-lg uppercase tracking-wider rounded-xl border-b-[6px] border-[#c79100] active:border-b-0 active:translate-y-[6px] transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Let's Play!
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] text-white overflow-hidden relative">
      {/* Magical background orbs */}
      <div className="absolute top-20 left-1/4 w-[350px] h-[350px] rounded-full bg-[#8b5cf6]/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] rounded-full bg-[#06b6d4]/[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#ffc107]/[0.03] blur-[160px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* ═══════════ STAGE 1: WELCOME SCREEN ═══════════ */}
        {stage === 'WELCOME_SCREEN' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
            className="relative z-10 w-full max-w-sm mx-auto px-6 py-8 flex flex-col items-center"
          >
            {/* Floating gamepad icon */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 mb-6 rounded-[2rem] bg-gradient-to-br from-[#ffc107] to-[#f59e0b] flex items-center justify-center shadow-[0_8px_0_#b45309,0_16px_40px_rgba(0,0,0,0.5)] border-b-[6px] border-[#b45309]"
            >
              <Gamepad2 size={52} className="text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.3)]" />
            </motion.div>

            {/* MASSIVE cartoonish PlayOnline logo */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', bounce: 0.4 }}
              className="text-5xl sm:text-6xl font-black text-white text-center mb-2 select-none"
              style={{ textShadow: '0 4px 0 rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)' }}
            >
              Play
              <span className="text-[#ffc107]">Online</span>
            </motion.h1>
            <p className="text-sm text-white/50 font-bold mb-10 text-center">The ultimate multi-game hub</p>

            {/* Pill-shaped username input */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full mb-6"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleNameConfirm()}
                placeholder="Enter your name..."
                maxLength={15}
                autoFocus
                className="w-full bg-[#0f172a]/50 border-4 border-[#3b82f6] rounded-full text-center text-xl text-white font-bold py-4 px-6 focus:outline-none focus:ring-4 focus:ring-blue-400/40 placeholder:text-white/25 transition-all"
              />
            </motion.div>

            {/* MASSIVE chunky gold PLAY button */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
              onClick={handleNameConfirm}
              disabled={!name.trim()}
              className="w-full py-5 px-8 bg-[#ffc107] text-[#5c3a21] font-black text-xl uppercase tracking-wider rounded-2xl border-b-[6px] border-[#c79100] active:border-b-0 active:translate-y-[6px] transition-all shadow-[0_6px_0_#c79100,0_10px_30px_rgba(0,0,0,0.3)] disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none"
            >
              PLAY
            </motion.button>
          </motion.div>
        )}

        {/* ═══════════ STAGE 2: MOBILE-APP STYLE HUB ═══════════ */}
        {stage === 'GAME_CATALOG' && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.35, type: 'spring', bounce: 0.2 }}
            className="relative z-10 w-full h-full max-w-4xl mx-auto flex flex-col overflow-hidden"
          >
            {/* ── Mobile-App Top Bar ── */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shrink-0 bg-[#0f172a]/80 backdrop-blur-md border-b-2 border-[#1e293b]">
              {/* Left: Avatar + Name */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] border-4 border-[#a78bfa] flex items-center justify-center text-white font-black text-xl shadow-[0_4px_0_#5b21b6]">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Player</p>
                  <p className="text-sm font-black text-white truncate max-w-[100px] sm:max-w-[160px]">{name}</p>
                </div>
              </div>

              {/* Right: Gems/Coins pill */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#1e293b] border-2 border-[#334155] rounded-full px-3 py-1.5 shadow-[0_3px_0_#141c2b]">
                  <Star size={14} className="text-[#ffc107] fill-[#ffc107]" />
                  <span className="text-xs font-black text-[#ffc107]">0</span>
                </div>
                <button
                  onClick={() => { soundManager.playClick(); setStage('WELCOME_SCREEN') }}
                  className="w-10 h-10 rounded-full bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center text-white/50 hover:text-white transition-colors shadow-[0_3px_0_#141c2b]"
                  title="Change Username"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* ── Game Cards Scroll Area ── */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 scrollbar-none">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-white flex items-center gap-2" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.3)' }}>
                  <Sparkles size={22} className="text-[#ffc107]" />
                  Choose Your Game
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pb-6">
                {gamesList.map((g) => (
                  <div
                    key={g.id}
                    className="bg-[#1e293b] rounded-3xl border-4 border-[#334155] p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Card top glow */}
                    {g.available && (
                      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#ffc107]/[0.07] blur-3xl pointer-events-none" />
                    )}

                    <div className="relative">
                      {g.renderEmblem()}
                      <h3 className="text-xl font-black text-white tracking-wide" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.4)' }}>
                        {g.title}
                      </h3>
                      <p className="text-xs text-[#ffc107] font-bold tracking-wider uppercase mt-0.5">
                        {g.subtitle}
                      </p>
                    </div>

                    <div className="mt-4">
                      {g.available ? (
                        <button
                          onClick={() => { soundManager.playClick(); setStage('IN_GAME_XO') }}
                          className="w-full py-3.5 px-5 bg-[#ffc107] text-[#5c3a21] font-black text-sm uppercase tracking-wider rounded-xl border-b-[5px] border-[#c79100] active:border-b-0 active:translate-y-[5px] transition-all shadow-[0_4px_0_#c79100,0_6px_16px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2"
                        >
                          Play Now
                          <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3.5 px-5 bg-[#334155] text-white/25 font-black text-sm uppercase tracking-wider rounded-xl border-b-[5px] border-[#1e293b] cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Lock size={14} />
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-white/25 font-bold border-t-2 border-[#1e293b] py-3 shrink-0 bg-[#0f172a]/60 backdrop-blur-sm">
              <Trophy size={12} className="text-[#ffc107]/60" />
              <span>Rise the leaderboards!</span>
            </div>
          </motion.div>
        )}

        {/* ═══════════ STAGE 3: XO SETUP MODAL ═══════════ */}
        {stage === 'IN_GAME_XO' && (
          <motion.div
            key="xo-setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full h-full flex items-center justify-center px-4"
          >
            {/* Blurred backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md"
              onClick={() => { soundManager.playClick(); setStage('GAME_CATALOG') }}
            />

            {/* Modal popup */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
              className="relative z-10 bg-[#475569] border-4 border-[#cbd5e1] rounded-3xl p-6 w-[90%] max-w-sm shadow-[0_8px_0_#334155,0_16px_50px_rgba(0,0,0,0.5)]"
            >
              {/* Close button */}
              <button
                onClick={() => { soundManager.playClick(); setStage('GAME_CATALOG') }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#334155] border-2 border-[#475569] flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#ffc107] to-[#f59e0b] flex items-center justify-center shadow-[0_4px_0_#b45309] border-b-[4px] border-[#b45309]">
                  <Gamepad2 size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-white" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.4)' }}>XO Arena</h2>
                <p className="text-xs text-white/60 font-bold mt-1">How do you want to play?</p>
              </div>

              {/* Player badge */}
              <div className="flex items-center gap-3 mb-5 bg-[#334155] rounded-2xl border-2 border-[#475569] p-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] border-3 border-[#a78bfa] flex items-center justify-center text-white font-black text-sm">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Playing as</p>
                  <p className="text-sm font-black text-white truncate">{name}</p>
                </div>
                <button onClick={() => { soundManager.playClick(); setStage('WELCOME_SCREEN') }} className="text-[10px] text-white/40 hover:text-[#ffc107] font-bold transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.05]">
                  Change
                </button>
              </div>

              {/* Two massive 3D buttons */}
              <div className="flex flex-col gap-3">
                {/* BATTLE (CREATE) - Green 3D */}
                <button
                  onClick={handleCreate}
                  className="w-full py-4 px-6 bg-[#22c55e] text-white font-black text-base uppercase tracking-wider rounded-2xl border-b-[6px] border-[#16a34a] active:border-b-0 active:translate-y-[6px] transition-all shadow-[0_6px_0_#16a34a,0_8px_20px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3"
                >
                  <Sword size={20} className="drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]" />
                  Battle (Create Room)
                </button>

                {/* JOIN FRIEND - Blue 3D */}
                <button
                  onClick={() => { soundManager.playClick() }}
                  className="w-full py-4 px-6 bg-[#3b82f6] text-white font-black text-base uppercase tracking-wider rounded-2xl border-b-[6px] border-[#2563eb] active:border-b-0 active:translate-y-[6px] transition-all shadow-[0_6px_0_#2563eb,0_8px_20px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3"
                >
                  <Handshake size={20} className="drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]" />
                  Join Friend
                </button>
              </div>

              {/* Join code input (revealed) */}
              {joinCode !== '' || (
                <div className="mt-3">
                  <button
                    onClick={() => setJoinCode(' ')}
                    className="w-full text-center text-xs text-white/30 font-bold hover:text-white/60 transition-colors py-1"
                  >
                    Have a room code? Tap here
                  </button>
                </div>
              )}
              {joinCode !== '' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden mt-4"
                >
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-2 text-center">Enter Room Code</p>
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={joinCode.trim() === '' ? '' : joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                      placeholder="CODE"
                      maxLength={8}
                      autoFocus
                      className="w-full bg-[#0f172a]/60 border-4 border-[#3b82f6] rounded-2xl text-center text-xl text-white font-black py-3.5 px-5 tracking-[0.3em] focus:outline-none focus:ring-4 focus:ring-blue-400/30 placeholder:text-white/20 transition-all"
                    />
                    <button
                      onClick={handlePaste}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center text-white/30 hover:text-[#ffc107] transition-colors"
                    >
                      {pasteSuccess ? <Check size={14} className="text-[#22c55e]" /> : <ClipboardPaste size={14} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { soundManager.playClick(); setJoinCode('') }}
                      className="flex-1 py-3 bg-[#334155] text-white/60 font-black text-sm uppercase tracking-wider rounded-xl border-b-[4px] border-[#1e293b] active:border-b-0 active:translate-y-[4px] transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleJoin}
                      disabled={joinCode.trim().length < 4}
                      className="flex-1 py-3 bg-[#22c55e] text-white font-black text-sm uppercase tracking-wider rounded-xl border-b-[4px] border-[#16a34a] active:border-b-0 active:translate-y-[4px] transition-all shadow-[0_4px_0_#16a34a] disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      Join
                      <ArrowRight size={14} />
                    </button>
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
