'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soundManager } from '@/lib/sound'
import { createPlatformerRoom, joinPlatformerRoom, checkPlatformerRoomExists } from './systems/NetworkSync'

interface PlatformerLobbyProps {
  playerId: string
  playerName: string
  onBack: () => void
}

export default function PlatformerLobby({ playerId, playerName, onBack }: PlatformerLobbyProps) {
  const router = useRouter()
  const [view, setView] = useState<'menu' | 'joining'>('menu')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    soundManager.playClick()
    setLoading(true)
    setError(null)
    try {
      const code = await createPlatformerRoom(playerId, playerName)
      router.push(`/dungeonrun/room/${code}?host=1`)
    } catch (err) {
      console.error(err)
      setError('Failed to create room. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    soundManager.playClick()
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) return
    setLoading(true)
    setError(null)
    try {
      const exists = await checkPlatformerRoomExists(code)
      if (!exists) {
        setError('Room not found.')
        setLoading(false)
        return
      }
      const ok = await joinPlatformerRoom(code, playerId, playerName)
      if (ok) {
        router.push(`/dungeonrun/room/${code}`)
      } else {
        setError('Room already full or has started.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to join room. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 140% 80% at 50% -20%, rgba(180,130,60,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 100% 60% at 80% 90%, rgba(180,130,60,0.06) 0%, transparent 50%),
          repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(255,215,0,0.015) 3px, rgba(255,215,0,0.015) 4px, transparent 4px, transparent 7px),
          linear-gradient(180deg, #1a0f0a 0%, #0d0806 50%, #120a06 100%)
        `
      }}
    >
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(180,130,60,0.07)' }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(200,160,80,0.05)' }} />

      <button onClick={onBack}
        className="absolute top-6 left-6 z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-105 active:scale-95"
        style={{ color: '#d4a84b', border: '1px solid rgba(212,168,75,0.25)', background: 'rgba(20,12,8,0.6)' }}>
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>

      <div className="flex flex-col items-center px-6 w-full max-w-xs">
        <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(218,165,32,0.15), rgba(139,101,8,0.1))', border: '1.5px solid rgba(139,101,8,0.25)' }}>
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#d4a84b" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="12" cy="12" r="3" />
            <path d="M3 9h18M9 3v18" opacity="0.4" />
          </svg>
        </div>

        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#f5e6c8] via-[#d4a84b] to-[#b8860b] text-center mb-1">
          AtlasJumper
        </h2>
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] mb-10" style={{ color: 'rgba(212,168,75,0.5)' }}>
          Multiplayer CO-OP
        </p>

        {error && (
          <p className="text-xs mb-4 text-center" style={{ color: 'rgba(255,100,100,0.7)' }}>{error}</p>
        )}

        {view === 'menu' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-[220px]">
            <button onClick={handleCreate} disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ padding: '0.7rem 1.5rem', background: 'linear-gradient(to bottom, #2a1a10, #1a0f0a)', border: '1px solid rgba(212,168,75,0.35)', boxShadow: 'inset 0 1px 0 rgba(212,168,75,0.12), 0 2px 6px rgba(0,0,0,0.4)', color: '#d4a84b' }}>
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            <button onClick={() => { soundManager.playClick(); setView('joining'); setError(null) }}
              className="w-full flex justify-center items-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{ padding: '0.7rem 1.5rem', background: 'linear-gradient(to bottom, #1f120c, #140b07)', border: '1px solid rgba(212,168,75,0.2)', color: 'rgba(212,168,75,0.7)' }}>
              Join Room Code
            </button>
          </div>
        )}

        {view === 'joining' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-[220px]">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="ROOM CODE"
              maxLength={4}
              autoFocus
              className="w-full text-center text-lg font-bold outline-none tracking-[0.3em] placeholder:text-[rgba(212,168,75,0.2)]"
              style={{ background: 'rgba(10,6,4,0.6)', border: '1px solid rgba(212,168,75,0.2)', borderRadius: '0.5rem', padding: '0.7rem 1rem', color: '#d4a84b' }}
            />
            <button onClick={handleJoin} disabled={loading || joinCode.trim().length < 4}
              className="w-full flex justify-center items-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-30"
              style={{ padding: '0.7rem 1.5rem', background: 'linear-gradient(to bottom, #2a1a10, #1a0f0a)', border: `1px solid ${joinCode.trim().length >= 4 ? 'rgba(212,168,75,0.35)' : 'rgba(212,168,75,0.1)'}`, boxShadow: joinCode.trim().length >= 4 ? 'inset 0 1px 0 rgba(212,168,75,0.12), 0 2px 6px rgba(0,0,0,0.4)' : 'none', color: joinCode.trim().length >= 4 ? '#d4a84b' : 'rgba(212,168,75,0.3)' }}>
              {loading ? 'Joining...' : 'Join'}
            </button>
            <button onClick={() => { soundManager.playClick(); setView('menu'); setError(null) }}
              className="text-xs font-semibold transition-all"
              style={{ color: 'rgba(212,168,75,0.4)' }}>
              Back
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
