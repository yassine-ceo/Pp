'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import FloatingDecor from '@/components/3d/FloatingDecor'
import { Gamepad2, Plus, LogIn, ArrowRight } from 'lucide-react'

export default function MainMenu() {
  const router = useRouter()
  const { playerName, setPlayerName, setPlayerId } = useGameStore()
  const [name, setName] = useState(playerName || '')
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'home' | 'join'>('home')
  const [nameConfirmed, setNameConfirmed] = useState(!!playerName)

  const handleNameConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    soundManager.playClick()
    setPlayerName(trimmed)
    try { localStorage.setItem('xo playerName', trimmed) } catch {}
    if (!useGameStore.getState().playerId) {
      try {
        const id = crypto.randomUUID()
        setPlayerId(id)
        localStorage.setItem('xo playerId', id)
      } catch {}
    }
    setNameConfirmed(true)
  }

  const handleCreate = () => {
    if (!nameConfirmed) return
    soundManager.playClick()
    router.push('/room/create')
  }

  const handleJoin = () => {
    if (!nameConfirmed || joinCode.trim().length < 4) return
    soundManager.playClick()
    router.push(`/room/${joinCode.trim().toUpperCase()}`)
  }

  return (
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-auto">
      <FloatingDecor count={6} />

      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/[0.04] blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-rose-400/20 border border-white/[0.08] flex items-center justify-center backdrop-blur-xl">
            <Gamepad2 size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 mb-2">
            XO Arena
          </h1>
          <p className="text-sm text-white/40">3D Multiplayer Tic Tac Toe</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-6"
        >
          {!nameConfirmed ? (
            <>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Enter your name</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
                placeholder="Your name..."
                maxLength={16}
                autoFocus
                className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-400/30 transition-colors mb-4"
              />
              <button
                onClick={handleNameConfirm}
                disabled={!name.trim()}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-400/20 to-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-semibold hover:from-cyan-400/25 hover:to-cyan-400/15 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </>
          ) : mode === 'home' ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Playing as <span className="text-white/60">{name}</span></p>
              <button
                onClick={handleCreate}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400/15 to-cyan-400/5 border border-cyan-400/20 text-cyan-400 text-sm font-semibold flex items-center justify-center gap-2 hover:from-cyan-400/25 hover:to-cyan-400/10 transition-all active:scale-[0.98]"
              >
                <Plus size={16} />
                Create Room
                <ArrowRight size={14} className="ml-auto" />
              </button>
              <button
                onClick={() => { soundManager.playClick(); setMode('join') }}
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/[0.09] transition-all active:scale-[0.98]"
              >
                <LogIn size={16} />
                Join Room
                <ArrowRight size={14} className="ml-auto" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Enter room code</p>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. ABCD"
                maxLength={8}
                autoFocus
                className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-400/30 transition-colors mb-4 font-mono tracking-widest text-center uppercase"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { soundManager.playClick(); setMode('home') }}
                  className="flex-1 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-sm font-semibold hover:bg-white/[0.09] transition-all active:scale-[0.98]"
                >
                  Back
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joinCode.trim().length < 4}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-cyan-400/15 to-cyan-400/5 border border-cyan-400/20 text-cyan-400 text-sm font-semibold hover:from-cyan-400/25 hover:to-cyan-400/10 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Join
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[11px] text-white/20 mt-6"
        >
          Built with Three.js · Firebase · Next.js
        </motion.p>
      </div>
    </div>
  )
}
