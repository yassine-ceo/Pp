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

  /* ════════ WELCOME + DEEP LINK ════════ */
  if (stage === 'WELCOME' || (deepRoom && !localStorage.getItem('xo playerName'))) {
    const isDeep = !!(deepRoom && !localStorage.getItem('xo playerName'))
    return (
      <main className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#3b82f6]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#22c55e]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-[2rem] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_2px_0_rgba(255,255,255,0.05)] border border-white/5 w-full max-w-md relative z-10">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-center leading-tight">
              Play<span className="text-transparent bg-clip-text bg-gradient-to-br from-[#22c55e] to-[#16a34a]">Online</span>
            </h1>

            {isDeep && (
              <p className="text-sm font-bold text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Joining room <span style={{ color: '#22c55e' }}>{deepRoom}</span>
              </p>
            )}

            <div style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.06)',
              borderRadius: '9999px',
              padding: '0.25rem',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
            }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitName()}
                placeholder="Enter your name..."
                maxLength={15}
                autoFocus
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '1rem 1.5rem',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                className="placeholder:text-gray-600"
              />
            </div>

            <div className="w-full" style={{ maxWidth: '320px' }}>
              <button
                onClick={submitName}
                disabled={!name.trim()}
                className="game-btn-primary"
                style={{
                  opacity: name.trim() ? 1 : 0.2,
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                  pointerEvents: name.trim() ? 'auto' : 'none',
                }}
              >
                LET'S PLAY
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  /* ════════ CATALOG (HUB) ════════ */
  return (
    <>
      <main className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] min-h-screen flex flex-col relative overflow-hidden">
        <div className="absolute top-[-10%] left-0 w-[50%] h-[50%] bg-[#3b82f6]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-0 w-[50%] h-[50%] bg-[#22c55e]/5 rounded-full blur-[100px] pointer-events-none" />

        <header style={{
          background: 'rgba(15,23,42,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 900,
              fontSize: '1rem',
              boxShadow: '0 4px 0 #14532d',
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Player</span>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem' }}>{name}</span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '9999px',
            border: '1px solid rgba(255,215,0,0.2)',
            color: '#FFD700',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}>
            <span>💎</span>
            <span>0</span>
          </div>
        </header>

        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full items-start pt-12 relative z-10">
          <article className="loot-chest">
            <div className="loot-chest-icon">
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '-0.5rem' }}>
                <XIcon />
                <OIcon />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-wide mb-1">
              XO Arena
            </h2>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#3b82f6' }}>Multiverse Duel</p>
            <button onClick={openSetup} className="game-btn-primary" style={{ fontSize: '1.25rem', padding: '0.75rem 2rem', maxWidth: '260px' }}>
              PLAY
            </button>
          </article>

          <article className="loot-chest" style={{ opacity: 0.4, pointerEvents: 'none' }}>
            <div className="loot-chest-icon">
              <svg viewBox="0 0 60 60" style={{ width: '3.5rem', height: '3.5rem', opacity: 0.3 }}>
                <path d="M24 50 C24 50 20 40 24 34 C28 28 24 22 30 18 C36 14 42 18 42 24 C42 30 38 34 38 36 L42 44 L42 50 Z" fill="#64748b" />
                <rect x="20" y="50" width="20" height="4" rx="1" fill="#64748b" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-wide mb-1">
              Chess Royale
            </h2>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#3b82f6' }}>Grandmaster Duel</p>
            <button disabled className="game-btn-primary" style={{ fontSize: '1.25rem', padding: '0.75rem 2rem', maxWidth: '260px', opacity: 0.3, pointerEvents: 'none', cursor: 'not-allowed' }}>
              LOCKED
            </button>
          </article>

          <article className="loot-chest md:col-span-2 max-w-md mx-auto" style={{ opacity: 0.4, pointerEvents: 'none' }}>
            <div className="loot-chest-icon">
              <svg viewBox="0 0 60 60" style={{ width: '3.5rem', height: '3.5rem', opacity: 0.3 }}>
                <rect x="18" y="10" width="24" height="40" rx="4" fill="none" stroke="#64748b" strokeWidth="3" />
                <path d="M30 22 C26 26 22 30 26 34 C30 38 30 38 30 38 C30 38 30 38 34 34 C38 30 34 26 30 22 Z" fill="#64748b" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-wide mb-1">
              Cards Arena
            </h2>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#3b82f6' }}>Poker Master</p>
            <button disabled className="game-btn-primary" style={{ fontSize: '1.25rem', padding: '0.75rem 2rem', maxWidth: '260px', opacity: 0.3, pointerEvents: 'none', cursor: 'not-allowed' }}>
              LOCKED
            </button>
          </article>
        </div>
      </main>

      {/* ════════ XO SETUP MODAL ════════ */}
      {stage === 'XO_SETUP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div style={{
            background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
            width: '100%',
            maxWidth: '24rem',
            borderRadius: '2rem',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            position: 'relative',
          }}>
            <button
              onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              ✕
            </button>

            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-center">
              XO Arena
            </h2>
            <p className="text-xs font-black uppercase tracking-widest text-center" style={{ color: '#3b82f6', marginTop: '-0.5rem' }}>
              Choose how to play
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '1rem',
              padding: '0.75rem 1rem',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 900,
                fontSize: '0.85rem',
                boxShadow: '0 3px 0 #14532d',
              }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Playing as</span>
                <span style={{ color: 'white', fontWeight: 900, fontSize: '0.85rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button onClick={createMatch} className="game-btn-primary" style={{ fontSize: '1.25rem', padding: '0.85rem 2rem' }}>
                CREATE MATCH
              </button>

              <button
                onClick={() => { soundManager.playClick(); setJoinPanel(!joinPanel) }}
                style={{
                  background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                  border: '2px solid #2563eb',
                  borderBottom: '8px solid #1e3a8a',
                  borderRadius: '1.5rem',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  textTransform: 'uppercase',
                  padding: '0.85rem 2rem',
                  textShadow: '0 2px 0 rgba(0,0,0,0.5)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                  transition: 'all 0.1s ease-in-out',
                  width: '100%',
                  cursor: 'pointer',
                }}
              >
                JOIN MATCH
              </button>

              {joinPanel && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.25rem' }} />
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && joinMatch()}
                    placeholder="ROOM CODE"
                    maxLength={8}
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '2px solid rgba(59,130,246,0.3)',
                      borderRadius: '1rem',
                      padding: '0.85rem 1rem',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: 'white',
                      letterSpacing: '0.3em',
                      outline: 'none',
                    }}
                    className="placeholder:text-gray-700"
                  />
                  <button
                    onClick={joinMatch}
                    disabled={joinCode.trim().length < 4}
                    className="game-btn-primary"
                    style={{
                      fontSize: '1.25rem',
                      padding: '0.85rem 2rem',
                      opacity: joinCode.trim().length >= 4 ? 1 : 0.2,
                      cursor: joinCode.trim().length >= 4 ? 'pointer' : 'not-allowed',
                      pointerEvents: joinCode.trim().length >= 4 ? 'auto' : 'none',
                    }}
                  >
                    JOIN
                  </button>
                </div>
              )}

              <button
                onClick={() => { soundManager.playClick(); setStage('CATALOG') }}
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  fontWeight: 700,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  transition: 'color 0.2s',
                  marginTop: '0.25rem',
                }}
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
