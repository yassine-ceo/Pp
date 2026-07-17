'use client'

import { useState, useEffect } from 'react'
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
      <main className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1e1b4b] via-[#0f172a] to-[#020617] min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-center mb-12">
          Play<span className="text-transparent bg-clip-text bg-gradient-to-br from-[#4ade80] to-[#16a34a]">Online</span>
        </h1>
        <p className="text-center font-bold mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Joining room <span style={{ color: '#4ade80' }}>{deepRoom}</span>
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitName()}
          placeholder="Your name..."
          maxLength={15}
          autoFocus
          className="w-full max-w-md bg-white/5 border-2 border-white/10 focus:border-[#4ade80] focus:bg-white/10 focus:shadow-[0_0_20px_rgba(74,222,128,0.3)] rounded-full text-center text-xl text-white font-bold py-5 outline-none transition-all placeholder:text-gray-500 mb-8 backdrop-blur-md"
        />
        <button
          onClick={submitName}
          disabled={!name.trim()}
          className="game-btn-primary"
          style={{ opacity: name.trim() ? 1 : 0.2, cursor: name.trim() ? 'pointer' : 'not-allowed' }}
        >
          LET'S PLAY
        </button>
      </main>
    )
  }

  /* ════════ WELCOME SCREEN ════════ */
  if (stage === 'WELCOME') {
    return (
      <main className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1e1b4b] via-[#0f172a] to-[#020617] min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-center mb-12">
          Play<span className="text-transparent bg-clip-text bg-gradient-to-br from-[#4ade80] to-[#16a34a]">Online</span>
        </h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitName()}
          placeholder="Enter your name..."
          maxLength={15}
          autoFocus
          className="w-full max-w-md bg-white/5 border-2 border-white/10 focus:border-[#4ade80] focus:bg-white/10 focus:shadow-[0_0_20px_rgba(74,222,128,0.3)] rounded-full text-center text-xl text-white font-bold py-5 outline-none transition-all placeholder:text-gray-500 mb-8 backdrop-blur-md"
        />
        <button
          onClick={submitName}
          disabled={!name.trim()}
          className="game-btn-primary"
          style={{ opacity: name.trim() ? 1 : 0.2, cursor: name.trim() ? 'pointer' : 'not-allowed' }}
        >
          LET'S PLAY
        </button>
      </main>
    )
  }

  /* ════════ CATALOG + XO SETUP ════════ */
  return (
    <>
      <main className="page-bg flex flex-col">

        {/* Top Bar */}
        <header className="top-bar">
          <div className="flex items-center gap-3">
            <div className="avatar-circle">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="subtitle-label" style={{ fontSize: '0.6rem' }}>Player</span>
              <span className="text-white font-black">{name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-yellow-400 font-bold text-sm"
               style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span>💎</span>
            <span>0</span>
          </div>
        </header>

        {/* Game Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">

          {/* XO Arena */}
          <article className="card-mobile-game">
            <div className="chest-icon">
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '-1rem' }}>
                <XIcon />
                <OIcon />
              </div>
            </div>
            <h2 className="title-text">XO Arena</h2>
            <p className="subtitle-label mb-2">Multiverse Duel</p>
            <button onClick={openSetup} className="btn-3d-green" style={{ marginTop: '0.5rem' }}>
              PLAY NOW
            </button>
          </article>

          {/* Chess Royale — locked */}
          <article className="card-mobile-game card-locked">
            <div className="chest-icon">
              <svg viewBox="0 0 60 60" style={{ width: '3.5rem', height: '3.5rem', opacity: 0.4 }}>
                <path d="M24 50 C24 50 20 40 24 34 C28 28 24 22 30 18 C36 14 42 18 42 24 C42 30 38 34 38 36 L42 44 L42 50 Z" fill="#94a3b8" />
                <rect x="20" y="50" width="20" height="4" rx="1" fill="#94a3b8" />
              </svg>
            </div>
            <h2 className="title-text">Chess Royale</h2>
            <p className="subtitle-label mb-2">Grandmaster Duel</p>
            <button disabled className="btn-3d-disabled">
              COMING SOON
            </button>
          </article>

          {/* Cards Arena — locked */}
          <article className="card-mobile-game card-locked">
            <div className="chest-icon">
              <svg viewBox="0 0 60 60" style={{ width: '3.5rem', height: '3.5rem', opacity: 0.4 }}>
                <rect x="18" y="10" width="24" height="40" rx="4" fill="none" stroke="#94a3b8" strokeWidth="3" />
                <path d="M30 22 C26 26 22 30 26 34 C30 38 30 38 30 38 C30 38 30 38 34 34 C38 30 34 26 30 22 Z" fill="#94a3b8" />
              </svg>
            </div>
            <h2 className="title-text">Cards Arena</h2>
            <p className="subtitle-label mb-2">Poker Master</p>
            <button disabled className="btn-3d-disabled">
              COMING SOON
            </button>
          </article>
        </div>
      </main>

      {/* ════════ XO SETUP MODAL ════════ */}
      {stage === 'XO_SETUP' && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button
              onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
              className="absolute top-4 right-4 flex items-center justify-center text-white font-bold transition-colors"
              style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                background: 'rgba(0,0,0,0.3)', border: '2px solid #6b8cce',
                fontSize: '0.9rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
              }}
            >
              ✕
            </button>

            <h3 className="title-text text-center" style={{ marginBottom: '-0.5rem' }}>XO Arena</h3>
            <p className="subtitle-label text-center" style={{ marginTop: '-0.5rem' }}>Choose how to play</p>

            <div className="player-pill">
              <div className="avatar-circle" style={{ width: '2.25rem', height: '2.25rem', fontSize: '0.8rem' }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <span className="subtitle-label" style={{ fontSize: '0.6rem', color: '#6b8cce', display: 'block' }}>Playing as</span>
                <span className="text-white font-black text-sm" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button onClick={createMatch} className="btn-3d-gold">
                CREATE MATCH
              </button>

              <button
                onClick={() => { soundManager.playClick(); setJoinPanel(!joinPanel) }}
                className="btn-3d-blue"
              >
                JOIN MATCH
              </button>

              {joinPanel && (
                <div className="flex flex-col gap-3" style={{ paddingTop: '0.5rem', borderTop: '2px solid rgba(107,140,206,0.3)' }}>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && joinMatch()}
                    placeholder="ROOM CODE"
                    maxLength={8}
                    autoFocus
                    className="w-full text-center text-2xl text-white font-black"
                    style={{
                      background: '#0b101a',
                      border: '4px solid #3b82f6',
                      borderRadius: '1.5rem',
                      padding: '1rem 1.25rem',
                      letterSpacing: '0.3em',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={joinMatch}
                    disabled={joinCode.trim().length < 4}
                    className="btn-3d-green"
                    style={{ opacity: joinCode.trim().length >= 4 ? 1 : 0.2, cursor: joinCode.trim().length >= 4 ? 'pointer' : 'not-allowed' }}
                  >
                    JOIN
                  </button>
                </div>
              )}

              <button
                onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
                className="font-bold text-center transition-colors"
                style={{ color: '#6b8cce', marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
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
