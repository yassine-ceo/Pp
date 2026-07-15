'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Plus, LogIn, User, Gamepad2, ArrowLeft } from 'lucide-react'
import { soundManager } from '@/lib/sound'
import dynamic from 'next/dynamic'

const FloatingDecor = dynamic(() => import('@/components/3d/FloatingDecor'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'idle' | 'join'>('idle')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('xo playerName')
    if (saved) setName(saved)

    // Auto-reconnect: if session exists, redirect to room
    const savedRoom = localStorage.getItem('xo roomId')
    const savedSlot = localStorage.getItem('xo slot')
    if (savedRoom && savedSlot) {
      router.replace(`/room/${savedRoom}`)
      return
    }
    setHydrated(true)
  }, [router])

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

  if (!hydrated) return null

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Dark background */}
      <div className="absolute inset-0 bg-[#0a0a1a]" />

      {/* Subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.06)_0%,transparent_60%)]" />

      {/* Floating 3D decorations */}
      <div className="absolute inset-0 z-0">
        <FloatingDecor />
      </div>

      {/* Menu overlay — pointer-events-none on wrapper */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-5 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm pointer-events-auto"
        >
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-rose-400/10 border border-white/[0.08] mb-5"
            >
              <Gamepad2 size={32} className="text-white" />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-cyan-400 via-white to-rose-400 bg-clip-text text-transparent">
              XO Arena
            </h1>
            <p className="text-sm text-white/40 mt-2 font-medium">3D Multiplayer Tic-Tac-Toe</p>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-6 shadow-2xl shadow-black/20">
            {/* Name Input */}
            <div className="mb-5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                Your Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={12}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/40 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {/* Buttons */}
            {mode === 'idle' ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="group w-full h-12 rounded-xl bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-cyan-400/25 hover:border-cyan-400/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
                  Create Room
                </button>
                <button
                  onClick={() => { setMode('join'); soundManager.playClick() }}
                  disabled={!name.trim()}
                  className="w-full h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/70 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/[0.08] hover:text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  <LogIn size={16} />
                  Join Room
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="e.g. X7B9"
                    maxLength={4}
                    autoFocus
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-base text-white text-center font-mono tracking-[0.35em] placeholder-white/20 outline-none focus:border-cyan-400/40 focus:bg-white/[0.07] transition-all uppercase"
                  />
                </div>
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
                  className="w-full h-10 flex items-center justify-center gap-1.5 text-white/30 text-xs font-medium hover:text-white/60 transition-colors"
                >
                  <ArrowLeft size={12} />
                  Back
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-white/15 mt-6 font-medium">
            No login required · Play with a friend
          </p>
        </motion.div>
      </div>
    </div>
  )
}
