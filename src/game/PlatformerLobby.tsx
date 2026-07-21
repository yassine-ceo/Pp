'use client'

import { useRouter } from 'next/navigation'
import { soundManager } from '@/lib/sound'

interface PlatformerLobbyProps {
  playerId: string
  playerName: string
  onBack: () => void
}

export default function PlatformerLobby({ onBack }: PlatformerLobbyProps) {
  const router = useRouter()

  const handlePlay = () => {
    soundManager.playClick()
    router.push('/dungeonrun/room/fireboy')
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
          Fireboy &amp; Watergirl
        </h2>
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] mb-10" style={{ color: 'rgba(212,168,75,0.5)' }}>
          Local Co-op
        </p>

        <button onClick={handlePlay}
          className="w-full max-w-[220px] flex justify-center items-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
          style={{ padding: '0.7rem 1.5rem', background: 'linear-gradient(to bottom, #2a1a10, #1a0f0a)', border: '1px solid rgba(212,168,75,0.35)', boxShadow: 'inset 0 1px 0 rgba(212,168,75,0.12), 0 2px 6px rgba(0,0,0,0.4)', color: '#d4a84b' }}>
          Play
        </button>
      </div>
    </main>
  )
}
