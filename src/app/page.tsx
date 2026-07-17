'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'

type Stage = 'WELCOME' | 'CATALOG' | 'XO_SETUP'
type JoinPanel = false | 'join'

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
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <defs>
        <linearGradient id="goldX" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <line x1="14" y1="14" x2="66" y2="66" stroke="url(#goldX)" strokeWidth="14" strokeLinecap="round" />
      <line x1="66" y1="14" x2="14" y2="66" stroke="url(#goldX)" strokeWidth="14" strokeLinecap="round" />
    </svg>
  )
}

function OIcon() {
  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16">
      <defs>
        <linearGradient id="silverO" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="22" fill="none" stroke="url(#silverO)" strokeWidth="12" />
    </svg>
  )
}

export default function PlayOnline() {
  const router = useRouter()
  const { playerName, setPlayerName, setPlayerId } = useGameStore()

  const [stage, setStage] = useState<Stage>('WELCOME')
  const [name, setName] = useState(playerName || '')
  const [joinPanel, setJoinPanel] = useState<JoinPanel>(false)
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
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] p-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <h1
            className="text-6xl font-black text-white"
            style={{ textShadow: '0 4px 0 rgba(0,0,0,0.5)' }}
          >
            Play<span className="text-[#fbbf24]">Online</span>
          </h1>

          <p className="text-white/50 font-bold -mt-4">
            Joining room <span className="text-[#22c55e]">{deepRoom}</span>
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
            className="w-full bg-[#ffc107] text-[#5c3a21] font-black text-2xl uppercase rounded-2xl border-b-[8px] border-[#c79100] active:border-b-0 active:translate-y-[8px] py-5 transition-all shadow-xl disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed"
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
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] p-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <h1
            className="text-6xl font-black text-white"
            style={{ textShadow: '0 4px 0 rgba(0,0,0,0.5)' }}
          >
            Play<span className="text-[#fbbf24]">Online</span>
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
            className="w-full bg-[#ffc107] text-[#5c3a21] font-black text-2xl uppercase rounded-2xl border-b-[8px] border-[#c79100] active:border-b-0 active:translate-y-[8px] py-5 transition-all shadow-xl disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed"
          >
            LET'S PLAY
          </button>
        </div>
      </main>
    )
  }

  /* ════════ CATALOG HUB ════════ */
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e1b4b] flex flex-col">
          {/* Mobile App Header */}
          <header className="flex justify-between items-center p-6 bg-white/5 border-b border-white/10">
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

          {/* Game Grid Container */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            {/* XO Arena Card */}
            <article className="bg-[#1e293b] rounded-[2rem] border-4 border-[#334155] p-6 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden">
              <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-inner border border-slate-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
                <div className="relative flex items-center justify-center">
                  <div className="absolute">
                    <XIcon />
                  </div>
                  <div className="absolute translate-x-2 translate-y-1">
                    <OIcon />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-black text-white">XO Arena</h2>
              <p className="text-sm text-white/40 font-bold -mt-2">Multiverse Duel</p>

              <button
                onClick={openSetup}
                className="w-full bg-[#22c55e] text-white font-black text-xl uppercase rounded-xl border-b-[6px] border-[#16a34a] active:border-b-0 active:translate-y-[6px] py-4 mt-2 transition-all shadow-lg"
              >
                PLAY NOW
              </button>
            </article>

            {/* Chess Royale — Coming Soon */}
            <article className="bg-[#1e293b] rounded-[2rem] border-4 border-[#334155] p-6 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden opacity-60">
              <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-inner border border-slate-600">
                <svg viewBox="0 0 60 60" className="w-14 h-14 opacity-40">
                  <path d="M24 50 C24 50 20 40 24 34 C28 28 24 22 30 18 C36 14 42 18 42 24 C42 30 38 34 38 36 L42 44 L42 50 Z" fill="#94a3b8" />
                  <rect x="20" y="50" width="20" height="4" rx="1" fill="#94a3b8" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white">Chess Royale</h2>
              <p className="text-sm text-white/40 font-bold -mt-2">Grandmaster Duel</p>
              <button disabled className="w-full bg-slate-600 text-white/30 font-black text-xl uppercase rounded-xl border-b-[6px] border-slate-700 py-4 mt-2 cursor-not-allowed">
                COMING SOON
              </button>
            </article>

            {/* Cards Arena — Coming Soon */}
            <article className="bg-[#1e293b] rounded-[2rem] border-4 border-[#334155] p-6 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden opacity-60">
              <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-inner border border-slate-600">
                <svg viewBox="0 0 60 60" className="w-14 h-14 opacity-40">
                  <rect x="18" y="10" width="24" height="40" rx="4" fill="none" stroke="#94a3b8" strokeWidth="3" />
                  <path d="M30 22 C26 26 22 30 26 34 C30 38 30 38 30 38 C30 38 30 38 34 34 C38 30 34 26 30 22 Z" fill="#94a3b8" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white">Cards Arena</h2>
              <p className="text-sm text-white/40 font-bold -mt-2">Poker Master</p>
              <button disabled className="w-full bg-slate-600 text-white/30 font-black text-xl uppercase rounded-xl border-b-[6px] border-slate-700 py-4 mt-2 cursor-not-allowed">
                COMING SOON
              </button>
            </article>
          </div>
        </main>

        {/* ════════ SETUP MODAL (rendered ON TOP of catalog) ════════ */}
        {stage === 'XO_SETUP' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1e293b] w-full max-w-sm rounded-[2rem] border-4 border-[#475569] p-8 shadow-2xl flex flex-col gap-6 relative">
              <button
                onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#334155] border-2 border-[#475569] flex items-center justify-center text-white/50 hover:text-white text-sm font-bold transition-colors"
              >
                ✕
              </button>

              <h3 className="text-2xl font-black text-white text-center">XO Arena</h3>
              <p className="text-sm text-white/40 font-bold text-center -mt-4">Choose how to play</p>

              {/* Player pill */}
              <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3 border border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] border-3 border-[#a78bfa] flex items-center justify-center text-white font-black text-sm">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider block">Playing as</span>
                  <span className="text-white font-black text-sm truncate block">{name}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={createMatch}
                  className="w-full bg-[#ffc107] text-[#5c3a21] font-black text-xl uppercase rounded-xl border-b-[6px] border-[#c79100] active:border-b-0 active:translate-y-[6px] py-4 transition-all shadow-lg"
                >
                  CREATE MATCH
                </button>

                <button
                  onClick={() => { soundManager.playClick(); setJoinPanel(joinPanel ? false : 'join') }}
                  className="w-full bg-[#3b82f6] text-white font-black text-xl uppercase rounded-xl border-b-[6px] border-[#2563eb] active:border-b-0 active:translate-y-[6px] py-4 transition-all shadow-lg"
                >
                  JOIN MATCH
                </button>

                {joinPanel && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && joinMatch()}
                      placeholder="ROOM CODE"
                      maxLength={8}
                      autoFocus
                      className="w-full bg-[#0f172a] border-4 border-[#3b82f6] rounded-xl text-center text-2xl text-white font-black py-4 px-5 tracking-[0.3em] focus:outline-none focus:ring-4 focus:ring-blue-400/30 placeholder:text-white/15 transition-all"
                    />
                    <button
                      onClick={joinMatch}
                      disabled={joinCode.trim().length < 4}
                      className="w-full bg-[#22c55e] text-white font-black text-lg uppercase rounded-xl border-b-[6px] border-[#16a34a] active:border-b-0 active:translate-y-[6px] py-4 transition-all shadow-lg disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                      JOIN
                    </button>
                  </div>
                )}

                <button
                  onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
                  className="text-slate-400 font-bold mt-2 hover:text-white text-center transition-colors"
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
