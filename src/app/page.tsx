'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Plus, LogIn, User, Gamepad2 } from 'lucide-react'
import { soundManager } from '@/lib/sound'
import dynamic from 'next/dynamic'

const GameScene = dynamic(() => import('@/components/3d/GameScene'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'idle' | 'join'>('idle')

  useEffect(() => {
    const saved = localStorage.getItem('xo playerName')
    if (saved) setName(saved)
  }, [])

  const handleCreate = () => {
    if (!name.trim()) return
    soundManager.playClick()
    localStorage.setItem('xo playerName', name.trim())
    router.push('/room/create')
  }

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return
    soundManager.playClick()
    localStorage.setItem('xo playerName', name.trim())
    router.push(`/room/${joinCode.trim().toUpperCase()}`)
  }

  return (
    <>
      {/* Background 3D scene — idle state */}
      <div className="fixed inset-0 z-0">
        <GameScene isPlaying={false} />
      </div>

      {/* Dark overlay */}
      <div className="fixed inset-0 z-10 bg-[#0a0a1a]/60 backdrop-blur-[2px]" />

      {/* Menu */}
      <div className="fixed inset-0 z-20 flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.08] mb-5"
            >
              <Gamepad2 size={28} className="text-white/80" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight">XO Arena</h1>
            <p className="text-sm text-white/40 mt-1">3D Multiplayer Tic-Tac-Toe</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6">
            {/* Name input */}
            <label className="block mb-4">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Your Name</span>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={12}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/40 transition-colors"
                />
              </div>
            </label>

            {mode === 'idle' ? (
              <div className="space-y-2.5">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="w-full h-12 rounded-xl bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-cyan-400/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  <Plus size={16} />
                  Create Room
                </button>
                <button
                  onClick={() => { setMode('join'); soundManager.playClick() }}
                  disabled={!name.trim()}
                  className="w-full h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/70 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  <LogIn size={16} />
                  Join Room
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <label className="block">
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Room Code</span>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="e.g. X7B9"
                    maxLength={4}
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white text-center font-mono tracking-[0.3em] placeholder-white/25 outline-none focus:border-cyan-400/40 transition-colors uppercase"
                  />
                </label>
                <button
                  onClick={handleJoin}
                  disabled={!name.trim() || joinCode.length < 4}
                  className="w-full h-12 rounded-xl bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-cyan-400/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  <LogIn size={16} />
                  Join Game
                </button>
                <button
                  onClick={() => { setMode('idle'); setJoinCode(''); soundManager.playClick() }}
                  className="w-full h-10 text-white/30 text-xs font-medium hover:text-white/60 transition-colors"
                >
                  Back
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-white/15 mt-6">
            No login required · Play with a friend
          </p>
        </motion.div>
      </div>
    </>
  )
}
