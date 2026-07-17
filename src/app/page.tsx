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
  Trophy
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
  
  // Platform stages
  const [stage, setStage] = useState<PlatformStage>('WELCOME_SCREEN')
  
  // Input and settings
  const [name, setName] = useState(playerName || '')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'home' | 'join'>('home')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [pasteSuccess, setPasteSuccess] = useState(false)
  const [deepLinkRoom, setDeepLinkRoom] = useState<string | null>(null)

  // Parse deep-link room query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = params.get('room')
    if (room) setDeepLinkRoom(room.trim().toUpperCase())
  }, [])

  // Restore/Initialize Player State
  useEffect(() => {
    const saved = localStorage.getItem('xo playerName')
    if (saved && saved.trim()) {
      setPlayerName(saved)
      setName(saved)
      setNameConfirmed(true)
      // Automatically navigate to the catalog if player has a saved name
      setStage('GAME_CATALOG')
    }
    let id = localStorage.getItem('xo playerId')
    if (!id) {
      try { id = crypto.randomUUID() } catch { id = Math.random().toString(36).slice(2) + Date.now().toString(36) }
      localStorage.setItem('xo playerId', id)
    }
    setPlayerId(id)
  }, [setPlayerName, setPlayerId])

  // Handle deep-link redirection on name confirmation
  useEffect(() => {
    if (deepLinkRoom && nameConfirmed) {
      soundManager.playClick()
      tryFullscreen()
      router.push(`/room/${deepLinkRoom}`)
    }
  }, [deepLinkRoom, nameConfirmed, router])

  const handleNameChange = (val: string) => {
    setName(val)
    const trimmed = val.trim()
    if (trimmed) {
      setPlayerName(trimmed)
      try { localStorage.setItem('xo playerName', trimmed) } catch {}
    }
  }

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

  // Dynamic game database
  const gamesList = [
    {
      id: 'xo',
      title: 'XO Arena',
      subtitle: 'Multiverse Duel',
      description: 'Skeuomorphic 3D multiverse battle. Challenge players in real-time.',
      available: true,
      renderEmblem: () => (
        <div className="relative w-full h-36 flex items-center justify-center bg-black/40 rounded-xl border border-white/[0.04] mb-4 overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-amber-500/[0.04] to-transparent pointer-events-none" />
          <svg viewBox="0 0 120 120" className="w-28 h-28 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
            <defs>
              <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF1C5" />
                <stop offset="30%" stopColor="#D4AF37" />
                <stop offset="70%" stopColor="#AA7C11" />
                <stop offset="100%" stopColor="#543D05" />
              </linearGradient>
              <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#B0B0B0" />
                <stop offset="100%" stopColor="#4A4A4A" />
              </linearGradient>
            </defs>
            <line x1="25" y1="25" x2="95" y2="95" stroke="url(#gold)" strokeWidth="14" strokeLinecap="round" />
            <circle cx="60" cy="60" r="26" fill="none" stroke="url(#silver)" strokeWidth="13" />
            <line x1="95" y1="25" x2="25" y2="95" stroke="url(#gold)" strokeWidth="14" strokeLinecap="round" className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
          </svg>
        </div>
      )
    },
    {
      id: 'chess',
      title: 'Chess Royale',
      subtitle: 'Grandmaster Duel',
      description: 'Tactical clash of intellect within a premium marble and wood hall.',
      available: false,
      renderEmblem: () => (
        <div className="relative w-full h-36 flex items-center justify-center bg-black/40 rounded-xl border border-white/[0.04] mb-4 overflow-hidden opacity-50">
          <svg viewBox="0 0 120 120" className="w-24 h-24 drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
            <defs>
              <linearGradient id="chess-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <path d="M45 85 C45 85 40 70 45 60 C50 50 45 40 55 35 C65 30 75 35 75 45 C75 55 70 60 70 65 L75 75 L75 85 Z" fill="url(#chess-grad)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <rect x="40" y="85" width="40" height="8" rx="2" fill="url(#chess-grad)" />
          </svg>
        </div>
      )
    },
    {
      id: 'cards',
      title: 'Cards Arena',
      subtitle: 'Poker Master',
      description: 'High-stakes classical poker club set on luxury leather tables.',
      available: false,
      renderEmblem: () => (
        <div className="relative w-full h-36 flex items-center justify-center bg-black/40 rounded-xl border border-white/[0.04] mb-4 overflow-hidden opacity-50">
          <svg viewBox="0 0 120 120" className="w-24 h-24 drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
            <defs>
              <linearGradient id="card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <rect x="35" y="20" width="50" height="80" rx="8" fill="none" stroke="url(#card-grad)" strokeWidth="3" />
            <path d="M60 40 C52 48 44 56 52 64 C60 72 60 72 60 72 C60 72 60 72 68 64 C76 56 68 48 60 40 Z" fill="url(#card-grad)" />
            <path d="M57 70 L63 70 L65 80 L55 80 Z" fill="url(#card-grad)" />
          </svg>
        </div>
      )
    }
  ]

  // Render deep link name confirmation screen if room deep-link is present but user has no name
  if (deepLinkRoom && !nameConfirmed) {
    return (
      <div className="min-h-screen h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#0b0c10] via-[#1f2833] to-[#0b0c10] text-white px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[140px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.15)]">
              <Gamepad2 size={28} className="text-emerald-400" />
            </div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-white/60 mb-2 tracking-wide">PlayOnline</h1>
            <p className="text-sm text-white/40">You have been invited to room <span className="text-emerald-400 font-mono font-black">{deepLinkRoom}</span></p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="max-w-md w-full bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-4 font-bold">Choose a username to join</p>
            <div className="relative h-16 rounded-2xl bg-black/60 border border-white/10 focus-within:border-emerald-400 focus-within:shadow-[0_0_20px_rgba(52,211,153,0.2)] transition-all duration-300 flex items-center px-4 mb-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
                placeholder="Username..."
                maxLength={15}
                autoFocus
                className="w-full h-full bg-transparent outline-none border-none text-white text-lg font-medium"
              />
            </div>
            <button
              onClick={handleNameConfirm}
              disabled={!name.trim()}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-sm font-black tracking-widest uppercase hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(52,211,153,0.25)]"
            >
              Join Game Room
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#0b0c10] via-[#1f2833] to-[#0b0c10] text-white overflow-hidden relative">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/[0.03] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] left-[10%] w-[300px] h-[300px] rounded-full bg-purple-500/[0.03] blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* STAGE 1: WELCOME SCREEN */}
        {stage === 'WELCOME_SCREEN' && (
          <motion.div
            key="stage-welcome"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -60, transition: { duration: 0.35, ease: 'easeIn' } }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md mx-auto px-6 py-8 flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 mb-8 rounded-3xl bg-gradient-to-br from-amber-400/20 to-cyan-400/20 border border-white/10 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              <Gamepad2 size={36} className="text-amber-400" />
            </motion.div>

            {/* Glowing Brand Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-5xl sm:text-6xl font-black tracking-wider text-center mb-10 flex items-center justify-center gap-1 select-none"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                Play
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                Online
              </span>
            </motion.h1>

            {/* Premium Centered Username Input Container */}
            <div className="w-full max-w-sm mb-6">
              <div className={`
                relative h-16 rounded-2xl bg-black/60 border transition-all duration-300 flex items-center px-4
                ${isInputFocused
                  ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'border-white/10 hover:border-white/20'
                }
              `}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleNameConfirm()}
                  maxLength={15}
                  className="w-full h-full bg-transparent outline-none border-none text-white text-lg font-semibold pt-4"
                  style={{ caretColor: '#fbbf24' }}
                />
                <label className={`
                  absolute left-4 transition-all duration-200 pointer-events-none select-none font-bold
                  ${(isInputFocused || name)
                    ? 'top-2 text-[10px] text-amber-400 tracking-wider uppercase'
                    : 'top-1/2 -translate-y-1/2 text-white/30 text-base'
                  }
                `}>
                  Enter Username
                </label>
                {name && (
                  <button
                    onClick={() => { setName(''); setPlayerName(''); try { localStorage.removeItem('xo playerName') } catch {} }}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors ml-2 shrink-0"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Premium Button with hover/pulse glow */}
            <motion.button
              onClick={handleNameConfirm}
              disabled={!name.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                boxShadow: name.trim()
                  ? [
                      "0 0 15px rgba(245,158,11,0.2)",
                      "0 0 30px rgba(245,158,11,0.5)",
                      "0 0 15px rgba(245,158,11,0.2)"
                    ]
                  : "none"
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="w-full max-w-sm h-14 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black text-sm font-black tracking-widest uppercase hover:brightness-110 active:brightness-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Let's Play
            </motion.button>
          </motion.div>
        )}

        {/* STAGE 2: THE PREMIUM GAME CATALOG */}
        {stage === 'GAME_CATALOG' && (
          <motion.div
            key="stage-catalog"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60, transition: { duration: 0.3 } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 w-full h-full max-w-4xl mx-auto px-4 py-6 flex flex-col justify-between overflow-hidden"
          >
            {/* Header section */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5 shrink-0">
              {/* Profile card with customizable/generated avatar */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-600 border border-amber-300/30 flex items-center justify-center text-black font-extrabold text-lg shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Player Profile</p>
                  <p className="text-sm font-black text-white truncate max-w-[120px] sm:max-w-[180px]">{name}</p>
                </div>
                {/* Edit Button */}
                <button
                  onClick={() => { soundManager.playClick(); setStage('WELCOME_SCREEN') }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-all border border-white/[0.05]"
                  title="Change Username"
                >
                  <Settings size={14} />
                </button>
              </div>

              {/* Centered Hub Logo */}
              <div className="hidden sm:flex items-center gap-1 select-none">
                <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">Play</span>
                <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">Online</span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hub Online
              </div>
            </div>

            {/* Catalog Content */}
            <div className="flex-1 overflow-y-auto py-6 sm:py-8 pr-1 my-2 scrollbar-none">
              <div className="mb-6">
                <h2 className="text-2xl font-black tracking-wide text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  Available Arenas
                </h2>
                <p className="text-xs text-white/40 mt-1">Select an active game portal to begin matchmaking.</p>
              </div>

              {/* Double-column scroll on mobile, 3-columns on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {gamesList.map((g) => (
                  <div
                    key={g.id}
                    className="group bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col justify-between h-full hover:scale-[1.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Glow element behind image */}
                    {g.available && (
                      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/[0.03] blur-2xl group-hover:bg-amber-500/[0.06] transition-colors pointer-events-none" />
                    )}

                    <div>
                      {/* Programmatic Code Artwork */}
                      {g.renderEmblem()}

                      {/* Header and description */}
                      <h3 className="text-lg font-black tracking-wide text-white mt-1 group-hover:text-amber-400 transition-colors">
                        {g.title}
                      </h3>
                      <p className="text-[11px] text-amber-500/80 font-semibold tracking-wider uppercase mt-0.5">
                        {g.subtitle}
                      </p>
                      <p className="text-xs text-white/40 mt-2 mb-6 leading-relaxed">
                        {g.description}
                      </p>
                    </div>

                    {/* Action button */}
                    {g.available ? (
                      <button
                        onClick={() => { soundManager.playClick(); setStage('IN_GAME_XO') }}
                        className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all active:scale-[0.98] shadow-[0_4px_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2"
                      >
                        Launch Game
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full h-11 rounded-2xl bg-white/5 border border-white/5 text-white/20 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock size={12} />
                        Coming Soon
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer badge */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-white/30 border-t border-white/[0.04] pt-4 shrink-0">
              <Trophy size={12} className="text-amber-500/50" />
              <span>Compete with friends and rise the leaderboards</span>
            </div>
          </motion.div>
        )}

        {/* STAGE 3: THE UNTOUCHED XO GAME SETUP/ROOM UI */}
        {stage === 'IN_GAME_XO' && (
          <motion.div
            key="stage-ingame"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md mx-auto px-6 py-8"
          >
            {/* Outer wrapper keeping original design constraints */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-400/20 to-cyan-400/20 border border-amber-400/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <Gamepad2 size={28} className="text-amber-400" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-100 to-white/60 mb-2">XO Arena</h1>
              <p className="text-sm text-white/40">Multiplayer Tic Tac Toe Room Setup</p>
            </div>

            <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl mx-auto">
              {mode === 'home' ? (
                <div className="flex flex-col gap-3">
                  {/* Playing as placard */}
                  <div className="flex items-center gap-3 mb-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-cyan-400/20 border border-amber-400/20 flex items-center justify-center text-amber-400 text-sm font-bold shadow-[0_0_12px_rgba(245,158,11,0.1)]">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/25 uppercase tracking-wider font-bold">Playing as</p>
                      <p className="text-sm font-bold text-white truncate">{name}</p>
                    </div>
                    <button onClick={() => { soundManager.playClick(); setStage('WELCOME_SCREEN') }} className="flex items-center gap-1 text-[11px] text-white/30 hover:text-amber-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/[0.04]">
                      <Settings size={11} />
                      Edit Name
                    </button>
                  </div>

                  {/* Create Room */}
                  <button onClick={handleCreate} className="relative w-full h-13 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-sm font-black flex items-center justify-center gap-2.5 hover:brightness-110 transition-all active:scale-[0.97] shadow-[0_0_25px_rgba(245,158,11,0.2)] overflow-hidden group uppercase tracking-wider">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Plus size={18} strokeWidth={2.5} />
                    Create Room
                    <ArrowRight size={14} className="ml-auto" />
                  </button>

                  {/* Join Room menu toggle */}
                  <button onClick={() => { soundManager.playClick(); setMode('join') }} className="relative w-full h-13 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-white/70 text-sm font-bold flex items-center justify-center gap-2.5 hover:bg-white/[0.08] hover:text-white transition-all active:scale-[0.97] uppercase tracking-wider">
                    <LogIn size={16} />
                    Join Room
                    <ArrowRight size={14} className="ml-auto" />
                  </button>

                  {/* Return back to catalog */}
                  <button onClick={() => { soundManager.playClick(); setStage('GAME_CATALOG') }} className="w-full h-12 rounded-2xl border border-white/[0.08] bg-transparent text-white/40 text-xs font-bold hover:text-white/60 hover:bg-white/[0.02] transition-all active:scale-[0.97] mt-3 flex items-center justify-center gap-1">
                    <ArrowLeft size={12} />
                    Back to Platform Hub
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-4 font-bold">Enter room code</p>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                      placeholder="ABCD"
                      maxLength={8}
                      autoFocus
                      className="w-full h-14 rounded-xl bg-black/50 border border-white/10 px-5 pr-14 text-base text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-amber-400/60 transition-all font-mono tracking-widest text-center uppercase"
                    />
                    <button onClick={handlePaste} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/25 hover:text-amber-400 hover:bg-white/[0.08] transition-all" title="Paste from clipboard">
                      {pasteSuccess ? <Check size={14} className="text-emerald-400" /> : <ClipboardPaste size={14} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { soundManager.playClick(); setMode('home') }} className="flex-1 h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/50 text-sm font-semibold hover:bg-white/[0.08] transition-all active:scale-[0.97]">
                      Back
                    </button>
                    <button onClick={handleJoin} disabled={joinCode.trim().length < 4} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-sm font-bold hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      Join
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
