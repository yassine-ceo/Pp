'use client'

import { useState, useCallback } from 'react'
import VanillaGame from './VanillaGame'
import TouchControls from './TouchControls'

interface DungeonRunProps {
  roomCode: string
  playerId: string
  playerName: string
  isHost: boolean
  onBack: () => void
}

export default function DungeonRun({ roomCode, playerId, playerName, isHost, onBack }: DungeonRunProps) {
  const [playerCount, setPlayerCount] = useState(1)
  const [levelStarted, setLevelStarted] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRemoteJoin = useCallback(() => {
    setPlayerCount(2)
  }, [])

  const handleLevelStart = useCallback(() => {
    setLevelStarted(true)
  }, [])

  const handleShareLink = useCallback(() => {
    const url = `${window.location.origin}/?room=${roomCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [roomCode])

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Top status bar — glassmorphism */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 backdrop-blur-xl"
        style={{ background: 'rgba(13,8,6,0.7)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: levelStarted ? 'rgba(212,168,75,0.8)' : 'rgba(255,255,255,0.5)' }}>
            {levelStarted ? 'In Game' : `${playerCount}/2 Waiting...`}
          </span>
          <span className="px-2 py-0.5 rounded text-[0.55rem] font-bold tracking-widest"
            style={{ background: 'rgba(212,168,75,0.1)', border: '1px solid rgba(212,168,75,0.2)', color: '#d4a84b' }}>
            {roomCode}
          </span>
        </div>

        <button onClick={handleShareLink}
          className="flex items-center justify-center px-3 py-1.5 rounded-lg text-[0.6rem] font-semibold transition-all hover:bg-white/10 gap-1.5"
          style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      <VanillaGame
        roomCode={roomCode}
        playerId={playerId}
        playerName={playerName}
        isHost={isHost}
        onRemoteJoin={handleRemoteJoin}
        onLevelStart={handleLevelStart}
        onError={console.error}
      />

      <TouchControls />
    </div>
  )
}
