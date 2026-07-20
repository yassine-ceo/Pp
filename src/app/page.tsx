'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import HeroAnimation from '@/components/HeroAnimation'

type Stage = 'WELCOME' | 'CATALOG' | 'XO_SETUP'

function tryFullscreen() {
  try {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen()
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen()
    else if ((el as any).mozRequestFullScreen) (el as any).mozRequestFullScreen()
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen()
  } catch {}
}

function XDeco({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 80 80" className={className} style={style}>
      <defs>
        <linearGradient id="gxd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <line x1="16" y1="16" x2="64" y2="64" stroke="url(#gxd)" strokeWidth="10" strokeLinecap="round" />
      <line x1="64" y1="16" x2="16" y2="64" stroke="url(#gxd)" strokeWidth="10" strokeLinecap="round" />
    </svg>
  )
}

function ODeco({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 80 80" className={className} style={style}>
      <defs>
        <linearGradient id="god" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="24" fill="none" stroke="url(#god)" strokeWidth="10" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 80 80" style={{ width: '4rem', height: '4rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}>
      <defs>
        <linearGradient id="gx" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <line x1="14" y1="14" x2="66" y2="66" stroke="url(#gx)" strokeWidth="14" strokeLinecap="round" />
      <line x1="66" y1="14" x2="14" y2="66" stroke="url(#gx)" strokeWidth="14" strokeLinecap="round" />
    </svg>
  )
}

function OIcon() {
  return (
    <svg viewBox="0 0 80 80" style={{ width: '4rem', height: '4rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}>
      <defs>
        <linearGradient id="go" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="22" fill="none" stroke="url(#go)" strokeWidth="12" />
    </svg>
  )
}

export default function PlayOnline() {
  const router = useRouter()
  const { playerName, setPlayerName, setPlayerId } = useGameStore()

  const [stage, setStage] = useState<Stage>('WELCOME')
  const [name, setName] = useState(playerName || '')
  const [joinPanel, setJoinPanel] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [deepRoom, setDeepRoom] = useState<string | null>(null)
  const [booted, setBooted] = useState(false)
  const [playedTimeMs, setPlayedTimeMs] = useState(0)
  const nameRef = useRef<HTMLInputElement>(null)

  const level = Math.floor(playedTimeMs / (30 * 60 * 1000)) + 1

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
    setBooted(true)
  }, [setPlayerName, setPlayerId])

  useEffect(() => {
    if (deepRoom && booted) {
      const saved = localStorage.getItem('xo playerName')
      if (saved?.trim()) {
        soundManager.playClick()
        tryFullscreen()
        router.push(`/room/${deepRoom}`)
      }
    }
  }, [deepRoom, booted, router])

  useEffect(() => {
    if (stage === 'WELCOME') {
      setTimeout(() => nameRef.current?.focus(), 300)
    }
  }, [stage])

  /* ── Background leveling timer ── */
  useEffect(() => {
    if (stage !== 'CATALOG') return

    const saved = parseInt(localStorage.getItem('xo playedTimeMs') || '0', 10)
    let totalMs = saved
    let startTime = Date.now()
    setPlayedTimeMs(totalMs)

    const tick = () => {
      if (!navigator.onLine || document.hidden) {
        startTime = Date.now()
        return
      }
      const elapsed = Date.now() - startTime
      totalMs += elapsed
      startTime = Date.now()
      setPlayedTimeMs(totalMs)
      localStorage.setItem('xo playedTimeMs', String(totalMs))
    }

    const interval = setInterval(tick, 2000)

    return () => {
      clearInterval(interval)
      localStorage.setItem('xo playedTimeMs', String(totalMs))
    }
  }, [stage])

  const submitName = () => {
    const t = name.trim()
    if (!t) return
    soundManager.playClick()
    setPlayerName(t)
    localStorage.setItem('xo playerName', t)
    setStage('CATALOG')
  }

  const openSetup = () => {
    soundManager.playClick()
    setJoinPanel(false)
    setJoinCode('')
    setStage('XO_SETUP')
  }

  const createMatch = () => {
    soundManager.playClick()
    router.push('/room/create')
  }

  const joinMatch = () => {
    if (joinCode.trim().length < 4) return
    soundManager.playClick()
    router.push(`/room/${joinCode.trim().toUpperCase()}`)
  }

  if (!booted) return null

  /* ════════ WELCOME + DEEP LINK ════════ */
  if (stage === 'WELCOME' || (deepRoom && !localStorage.getItem('xo playerName'))) {
    const isDeep = !!(deepRoom && !localStorage.getItem('xo playerName'))
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617]">

        {/* Ambient glow orbs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Floating decorative X/O icons */}
        <XDeco className="absolute top-[12%] right-[18%] w-24 h-24 opacity-[0.06] animate-float-drift pointer-events-none" />
        <ODeco className="absolute bottom-[25%] left-[8%] w-32 h-32 opacity-[0.05] animate-float-drift-2 pointer-events-none" />
        <XDeco className="absolute top-[55%] right-[8%] w-16 h-16 opacity-[0.04] animate-float-drift pointer-events-none" style={{ animationDelay: '1.5s' }} />
        <ODeco className="absolute top-[18%] left-[25%] w-20 h-20 opacity-[0.04] animate-float-drift-2 pointer-events-none" style={{ animationDelay: '3s' }} />

        {/* Premium SVG brand logo */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 flex items-center z-30">
          <svg viewBox="0 0 110 70" className="h-10 md:h-12 w-auto drop-shadow-md">
            <circle cx="68" cy="30" r="21" fill="none" stroke="#ffffff" strokeWidth="7.5" />
            <circle cx="35" cy="30" r="21" fill="none" stroke="#ffffff" strokeWidth="7.5" />
            <line x1="14" y1="30" x2="14" y2="68" stroke="#ffffff" strokeWidth="7.5" />
            <path d="M 28 17 L 47 30 L 28 43 Z" fill="#38bdf8" />
          </svg>
          <span className="text-white text-3xl md:text-4xl font-sans tracking-tight ml-2" style={{ fontWeight: 500 }}>
            PlayOnline
          </span>
        </div>

        {/* Deep link room banner */}
        {isDeep && (
          <div className="absolute top-24 right-6 md:top-28 md:right-12 text-right">
            <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Joining room
            </p>
            <p style={{ color: '#22c55e', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.15em' }}>
              {deepRoom}
            </p>
          </div>
        )}

        {/* Tagline — floating center-right on desktop */}
        <div className="hidden md:block absolute top-1/3 right-12 -translate-y-1/2 text-right">
          <p style={{ color: 'rgba(255,255,255,0.12)', fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.3em', lineHeight: 1.4 }}>
            Multiplayer<br />Arena
          </p>
        </div>

        {/* Bottom interaction dock */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[90%] max-w-[450px] flex flex-col gap-6 items-center z-20">
          <HeroAnimation />
          <div className="w-full" style={{
            background: 'rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.06)',
            borderRadius: '9999px',
            padding: '0.25rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
          }}>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitName()}
              placeholder="ENTER YOUR NAME"
              maxLength={15}
              className="w-full text-center text-lg md:text-xl text-white font-black outline-none tracking-wider placeholder:text-gray-700"
              style={{ background: 'transparent', border: 'none', borderRadius: '9999px', padding: '1rem 1.5rem', transition: 'all 0.2s' }}
            />
          </div>
          <button
            onClick={submitName}
            disabled={!name.trim()}
            className="game-btn-primary"
            style={{
              opacity: name.trim() ? 1 : 0.2,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              pointerEvents: name.trim() ? 'auto' : 'none',
              padding: '0.85rem 3.5rem',
              fontSize: '1.4rem',
            }}
          >
            LET'S PLAY
          </button>
        </div>
      </main>
    )
  }

  /* ════════ XO SETUP — Full Page ════════ */
  if (stage === 'XO_SETUP') {
    return (
      <main className="relative w-screen h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] flex flex-col overflow-y-auto">
        {/* Ambient glow orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#3b82f6]/8 rounded-full blur-[120px] animate-glow-pulse pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#22c55e]/8 rounded-full blur-[120px] animate-glow-pulse pointer-events-none" style={{ animationDelay: '2.5s' }} />

        {/* Decorative X/O */}
        <XDeco className="absolute top-[8%] right-[12%] w-20 h-20 opacity-[0.04] animate-float-drift pointer-events-none" />
        <ODeco className="absolute bottom-[15%] left-[5%] w-28 h-28 opacity-[0.03] animate-float-drift-2 pointer-events-none" />

        {/* Back arrow */}
        <button
          onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
          className="absolute top-6 left-6 z-10 flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-center">
            XO Arena
          </h2>
          <p className="text-xs font-black uppercase tracking-widest text-center mt-2" style={{ color: '#3b82f6' }}>
            Choose how to play
          </p>

          <div className="flex flex-col items-center gap-5 mt-12 w-full max-w-[260px]">
            <button
              onClick={createMatch}
              className="w-full flex justify-center items-center gap-2 rounded-xl border text-white text-sm font-semibold transition-all hover:bg-white/10 active:scale-[0.97]"
              style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              Create Match
            </button>

            <button
              onClick={() => { soundManager.playClick(); setJoinPanel(!joinPanel) }}
              className="w-full flex justify-center items-center gap-2 rounded-xl border text-white text-sm font-semibold transition-all hover:bg-white/10 active:scale-[0.97]"
              style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
            >
              Join Match
            </button>

            {joinPanel && (
              <div className="flex flex-col items-center gap-3 w-full mt-1">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinMatch()}
                  placeholder="Room Code"
                  maxLength={8}
                  autoFocus
                  className="w-full text-center text-sm text-white font-semibold outline-none tracking-widest placeholder:text-gray-600"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.6rem 1rem' }}
                />
                <button
                  onClick={joinMatch}
                  disabled={joinCode.trim().length < 4}
                  className="w-full flex justify-center items-center gap-2 rounded-xl border text-white text-sm font-semibold transition-all active:scale-[0.97]"
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: joinCode.trim().length >= 4 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    borderColor: joinCode.trim().length >= 4 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                    opacity: joinCode.trim().length >= 4 ? 1 : 0.35,
                    cursor: joinCode.trim().length >= 4 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Join
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  /* ════════ CATALOG (HUB) ════════ */
  return (
    <>
      <main className="relative w-screen h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] flex flex-col">

        {/* Animated glow orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#3b82f6]/8 rounded-full blur-[120px] animate-glow-pulse pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#22c55e]/8 rounded-full blur-[120px] animate-glow-pulse pointer-events-none" style={{ animationDelay: '2.5s' }} />

        {/* Decorative icons */}
        <XDeco className="absolute top-[8%] right-[12%] w-20 h-20 opacity-[0.04] animate-float-drift pointer-events-none" />
        <ODeco className="absolute bottom-[15%] left-[5%] w-28 h-28 opacity-[0.03] animate-float-drift-2 pointer-events-none" />

        {/* Fixed Header — sticky, never scrolls */}
        <div className="sticky top-0 z-20">
          <header className="w-full flex justify-between items-center bg-transparent" style={{ padding: '24px' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 min-w-[40px] rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block leading-none">
                  LEVEL {level}
                </span>
                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden my-1 block">
                  <div className="h-full bg-blue-500" style={{ width: `${(playedTimeMs % 1800000) / 1800000 * 100}%` }} />
                </div>
                <span className="text-white font-bold text-sm block leading-none">{name}</span>
              </div>
            </div>
            <div className="bg-black/30 border border-gray-700 rounded-full px-3 py-1 flex items-center justify-center gap-2 min-w-[60px] h-8">
              <span className="text-[#FFD700] text-sm">💎</span>
              <span className="text-[#FFD700] font-bold text-sm leading-none">0</span>
            </div>
          </header>
        </div>

        {/* Scrollable Cards Dashboard — scrolls under the fixed header */}
        <div className="flex-1 overflow-y-auto pb-6" style={{ 
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 80px, black 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 80px, black 100%)'
        }}>
          <div className="flex flex-col items-center gap-5 pt-36">
            {/* Structural spacer — forces first card down past the fixed header */}
            <div className="h-14 w-full block clear-both" />
            {[1, 2, 3, 4, 5].map((i, index) => (
              <div key={i}
                className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 border border-white/10 w-[85%] max-w-sm mx-auto"
                style={{ aspectRatio: '16/9' }}
              >
                <img
                  src={index === 0 ? '/avatars/xo-background.png' : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop'}
                  alt={index === 0 ? 'XO Arena' : 'Coming Soon...'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-2 w-full flex flex-col items-center pb-12 px-3">
                  <h3 className="text-white font-bold text-lg w-[92%] text-left mb-2">{index === 0 ? 'XO Arena' : 'Coming Soon...'}</h3>
                  <button
                    onClick={index === 0 ? openSetup : undefined}
                    className={`w-[92%] flex justify-center items-center gap-2 rounded-full backdrop-blur-md border text-white font-semibold text-xs shadow-lg transition-transform active:scale-95 ${index === 0 ? 'bg-white/20 border-white/20 cursor-pointer' : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'}`}
                    style={{ height: '26px' }}
                    disabled={index !== 0}
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    {index === 0 ? 'Play' : 'Locked'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

    </>
  )
}
