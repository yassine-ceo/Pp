'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'

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

function XIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
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
    <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
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

const BTN_PRIMARY = 'bg-gradient-to-b from-[#52d017] to-[#258f00] text-white font-black text-2xl uppercase rounded-2xl border-[4px] border-[#134d00] shadow-[0_8px_0_#134d00,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_#134d00,0_0px_0_rgba(0,0,0,0.4)] active:translate-y-[8px] transition-all py-4 px-6'

const CARD_STYLE = 'bg-gradient-to-b from-[#3b5998] to-[#1e2b58] border-[6px] border-[#6b8cce] rounded-[2rem] shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_4px_0_rgba(255,255,255,0.2)] p-6 flex flex-col items-center text-center'

const TITLE_TEXT = 'text-4xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-wide mb-2'

const BG_PAGE = 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1b2740] via-[#0b101a] to-[#04060a]'

const TOP_BAR = 'bg-[#0b101a]/80 border-b-4 border-[#1e2b58] p-4 flex justify-between items-center'

export default function PlayOnline() {
  const router = useRouter()
  const { playerName, setPlayerName, setPlayerId } = useGameStore()

  const [stage, setStage] = useState<Stage>('WELCOME')
  const [name, setName] = useState(playerName || '')
  const [joinPanel, setJoinPanel] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [deepRoom, setDeepRoom] = useState<string | null>(null)
  const [booted, setBooted] = useState(false)

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
    tryFullscreen()
    router.push('/room/create')
  }

  const joinMatch = () => {
    if (joinCode.trim().length < 4) return
    soundManager.playClick()
    tryFullscreen()
    router.push(`/room/${joinCode.trim().toUpperCase()}`)
  }

  if (!booted) return null

  /* ════════ DEEP LINK: needs name ════════ */
  if (deepRoom && !localStorage.getItem('xo playerName')) {
    return (
      <main className={`flex flex-col items-center justify-center min-h-screen ${BG_PAGE} p-4`}>
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <h1 className="text-6xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)]">
            Play<span className="text-[#52d017]">Online</span>
          </h1>
          <p className="text-white/50 font-bold -mt-4">
            Joining room <span className="text-[#52d017]">{deepRoom}</span>
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitName()}
            placeholder="Your name..."
            maxLength={15}
            autoFocus
            className="w-full bg-[#1e293b] border-4 border-[#3b82f6] rounded-full text-center text-xl text-white font-bold py-4 px-6 focus:outline-none focus:ring-4 focus:ring-blue-400/30 placeholder:text-white/20 transition-all"
          />
          <button
            onClick={submitName}
            disabled={!name.trim()}
            className={`${BTN_PRIMARY} w-full disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed`}
          >
            LET'S PLAY
          </button>
        </div>
      </main>
    )
  }

  /* ════════ WELCOME SCREEN ════════ */
  if (stage === 'WELCOME') {
    return (
      <main className={`flex flex-col items-center justify-center min-h-screen ${BG_PAGE} p-4`}>
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <h1 className="text-6xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)]">
            Play<span className="text-[#52d017]">Online</span>
          </h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && submitName()}
            placeholder="Enter your name..."
            maxLength={15}
            autoFocus
            className="w-full bg-[#1e293b] border-4 border-[#3b82f6] rounded-full text-center text-xl text-white font-bold py-4 px-6 focus:outline-none focus:ring-4 focus:ring-blue-400/30 placeholder:text-white/20 transition-all"
          />
          <button
            onClick={submitName}
            disabled={!name.trim()}
            className={`${BTN_PRIMARY} w-full disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed`}
          >
            LET'S PLAY
          </button>
        </div>
      </main>
    )
  }

  /* ════════ CATALOG + XO SETUP ════════ */
  return (
    <>
      <main className={`min-h-screen ${BG_PAGE} flex flex-col`}>

        {/* Mobile Game Status Bar */}
        <header className={TOP_BAR}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] border-4 border-[#a78bfa] flex items-center justify-center text-white font-black text-xl shadow-[0_4px_0_#4c1d95]">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Player</span>
              <span className="text-white font-black text-base">{name}</span>
            </div>
          </div>
          <div className="bg-black/40 rounded-full px-4 py-2 border border-white/10 text-yellow-400 font-bold text-sm flex items-center gap-2">
            <span>💎</span>
            <span>0</span>
          </div>
        </header>

        {/* Game Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">

          {/* XO Arena — glossy chest card */}
          <article className={`${CARD_STYLE} relative overflow-hidden`}>
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#52d017]/[0.08] rounded-full blur-3xl pointer-events-none" />
            <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)] border-2 border-slate-500 relative overflow-hidden mb-2">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
              <div className="relative flex items-center justify-center -space-x-4">
                <XIcon />
                <OIcon />
              </div>
            </div>
            <h2 className={TITLE_TEXT}>XO Arena</h2>
            <p className="text-sm text-[#6b8cce] font-black uppercase tracking-wider mb-2">Multiverse Duel</p>
            <button onClick={openSetup} className={`${BTN_PRIMARY} w-full mt-2`}>
              PLAY NOW
            </button>
          </article>

          {/* Chess Royale — locked card */}
          <article className={`${CARD_STYLE} relative overflow-hidden opacity-50`}>
            <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)] border-2 border-slate-500 mb-2">
              <svg viewBox="0 0 60 60" className="w-14 h-14 opacity-40">
                <path d="M24 50 C24 50 20 40 24 34 C28 28 24 22 30 18 C36 14 42 18 42 24 C42 30 38 34 38 36 L42 44 L42 50 Z" fill="#94a3b8" />
                <rect x="20" y="50" width="20" height="4" rx="1" fill="#94a3b8" />
              </svg>
            </div>
            <h2 className={TITLE_TEXT}>Chess Royale</h2>
            <p className="text-sm text-[#6b8cce] font-black uppercase tracking-wider mb-2">Grandmaster Duel</p>
            <button disabled className="w-full bg-gradient-to-b from-slate-500 to-slate-700 text-white/40 font-black text-2xl uppercase rounded-2xl border-[4px] border-slate-800 shadow-[0_8px_0_#1a1a2e,0_15px_20px_rgba(0,0,0,0.4)] py-4 px-6 cursor-not-allowed">
              COMING SOON
            </button>
          </article>

          {/* Cards Arena — locked card */}
          <article className={`${CARD_STYLE} relative overflow-hidden opacity-50`}>
            <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)] border-2 border-slate-500 mb-2">
              <svg viewBox="0 0 60 60" className="w-14 h-14 opacity-40">
                <rect x="18" y="10" width="24" height="40" rx="4" fill="none" stroke="#94a3b8" strokeWidth="3" />
                <path d="M30 22 C26 26 22 30 26 34 C30 38 30 38 30 38 C30 38 30 38 34 34 C38 30 34 26 30 22 Z" fill="#94a3b8" />
              </svg>
            </div>
            <h2 className={TITLE_TEXT}>Cards Arena</h2>
            <p className="text-sm text-[#6b8cce] font-black uppercase tracking-wider mb-2">Poker Master</p>
            <button disabled className="w-full bg-gradient-to-b from-slate-500 to-slate-700 text-white/40 font-black text-2xl uppercase rounded-2xl border-[4px] border-slate-800 shadow-[0_8px_0_#1a1a2e,0_15px_20px_rgba(0,0,0,0.4)] py-4 px-6 cursor-not-allowed">
              COMING SOON
            </button>
          </article>
        </div>
      </main>

      {/* ════════ XO SETUP MODAL ════════ */}
      {stage === 'XO_SETUP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-b from-[#3b5998] to-[#1e2b58] w-full max-w-sm rounded-[2rem] border-[6px] border-[#6b8cce] p-8 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_4px_0_rgba(255,255,255,0.2)] flex flex-col gap-6 relative">
            <button
              onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 border-2 border-[#6b8cce] flex items-center justify-center text-white/60 hover:text-white text-sm font-bold transition-colors"
            >
              ✕
            </button>

            <h3 className="text-4xl font-black text-white text-center drop-shadow-[0_4px_0_rgba(0,0,0,1)]">XO Arena</h3>
            <p className="text-sm text-[#6b8cce] font-black text-center -mt-4 uppercase tracking-wider">Choose how to play</p>

            {/* Player pill */}
            <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3 border-2 border-[#6b8cce]/50 shadow-[inset_0_2px_0_rgba(255,255,255,0.1)]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] border-3 border-[#a78bfa] flex items-center justify-center text-white font-black text-sm shadow-[0_3px_0_#4c1d95]">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#6b8cce] font-bold uppercase tracking-wider block">Playing as</span>
                <span className="text-white font-black text-sm truncate block">{name}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button onClick={createMatch} className={`${BTN_PRIMARY} w-full`}>
                CREATE MATCH
              </button>

              <button
                onClick={() => { soundManager.playClick(); setJoinPanel(!joinPanel) }}
                className="w-full bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] text-white font-black text-2xl uppercase rounded-2xl border-[4px] border-[#1e3a8a] shadow-[0_8px_0_#1e3a8a,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_#1e3a8a,0_0px_0_rgba(0,0,0,0.4)] active:translate-y-[8px] transition-all py-4 px-6"
              >
                JOIN MATCH
              </button>

              {joinPanel && (
                <div className="flex flex-col gap-3 pt-2 border-t-2 border-[#6b8cce]/30">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && joinMatch()}
                    placeholder="ROOM CODE"
                    maxLength={8}
                    autoFocus
                    className="w-full bg-[#0b101a] border-4 border-[#3b82f6] rounded-2xl text-center text-2xl text-white font-black py-4 px-5 tracking-[0.3em] focus:outline-none focus:ring-4 focus:ring-blue-400/30 placeholder:text-white/15 transition-all"
                  />
                  <button onClick={joinMatch} disabled={joinCode.trim().length < 4}
                    className="bg-gradient-to-b from-[#52d017] to-[#258f00] text-white font-black text-2xl uppercase rounded-2xl border-[4px] border-[#134d00] shadow-[0_8px_0_#134d00,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_#134d00,0_0px_0_rgba(0,0,0,0.4)] active:translate-y-[8px] transition-all py-4 px-6 disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed w-full">
                    JOIN
                  </button>
                </div>
              )}

              <button
                onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
                className="text-[#6b8cce] font-bold mt-2 hover:text-white text-center transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
