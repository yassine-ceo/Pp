'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import FloatingDecor from '@/components/3d/FloatingDecor'
import { Gamepad2, Plus, LogIn, ArrowRight, Settings, X, ClipboardPaste, Check } from 'lucide-react'

export default function MainMenu() {
  const router = useRouter()
  const { playerName, setPlayerName, setPlayerId } = useGameStore()
  const [name, setName] = useState(playerName || '')
  const [joinCode, setJoinCode] = useState('')
  const [mode, setMode] = useState<'home' | 'join'>('home')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsName, setSettingsName] = useState('')
  const [pasteSuccess, setPasteSuccess] = useState(false)
  const [deepLinkRoom, setDeepLinkRoom] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = params.get('room')
    if (room) setDeepLinkRoom(room.trim().toUpperCase())
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('xo playerName')
    if (saved && saved.trim()) {
      setPlayerName(saved)
      setName(saved)
      setNameConfirmed(true)
    }
    let id = localStorage.getItem('xo playerId')
    if (!id) {
      try { id = crypto.randomUUID() } catch { id = Math.random().toString(36).slice(2) + Date.now().toString(36) }
      localStorage.setItem('xo playerId', id)
    }
    setPlayerId(id)
  }, [setPlayerName, setPlayerId])

  useEffect(() => {
    if (deepLinkRoom && nameConfirmed) {
      soundManager.playClick()
      router.push(`/room/${deepLinkRoom}`)
    }
  }, [deepLinkRoom, nameConfirmed, router])

  const handleNameConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    soundManager.playClick()
    setPlayerName(trimmed)
    try { localStorage.setItem('xo playerName', trimmed) } catch {}
    let id = localStorage.getItem('xo playerId')
    if (!id) {
      try { id = crypto.randomUUID() } catch { id = Math.random().toString(36).slice(2) + Date.now().toString(36) }
      localStorage.setItem('xo playerId', id)
      setPlayerId(id)
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

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      const cleaned = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
      setJoinCode(cleaned)
      setPasteSuccess(true)
      setTimeout(() => setPasteSuccess(false), 1500)
    } catch {
    }
  }, [])

  const openSettings = () => {
    setSettingsName(playerName || '')
    setSettingsOpen(true)
  }

  const saveSettings = () => {
    const trimmed = settingsName.trim()
    if (!trimmed) return
    soundManager.playClick()
    setPlayerName(trimmed)
    setName(trimmed)
    try { localStorage.setItem('xo playerName', trimmed) } catch {}
    setSettingsOpen(false)
  }

  if (deepLinkRoom && !nameConfirmed) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center pointer-events-auto px-6">
        <FloatingDecor count={4} />
        <div className="relative z-10 w-full max-w-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-rose-400/20 border border-white/[0.08] flex items-center justify-center backdrop-blur-xl">
              <Gamepad2 size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 mb-2">XO Arena</h1>
            <p className="text-sm text-white/40">Join room <span className="text-cyan-400 font-mono font-bold">{deepLinkRoom}</span></p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-6 sm:p-8">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-4">Enter your name to join</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
              placeholder="Your name..."
              maxLength={15}
              autoFocus
              className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-400/30 transition-colors mb-4"
            />
            <button
              onClick={handleNameConfirm}
              disabled={!name.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400/20 to-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-semibold hover:from-cyan-400/25 hover:to-cyan-400/15 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Join Game
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center pointer-events-auto">
      <FloatingDecor count={6} />
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-rose-400/20 border border-white/[0.08] flex items-center justify-center backdrop-blur-xl">
            <Gamepad2 size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 mb-2">XO Arena</h1>
          <p className="text-sm text-white/40">3D Multiplayer Tic Tac Toe</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-6 sm:p-8">
          {!nameConfirmed ? (
            <>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-4">Enter your name</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
                placeholder="Your name..."
                maxLength={15}
                autoFocus
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-400/30 transition-colors mb-4"
              />
              <button onClick={handleNameConfirm} disabled={!name.trim()} className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400/20 to-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-semibold hover:from-cyan-400/25 hover:to-cyan-400/15 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed">
                Continue
              </button>
            </>
          ) : mode === 'home' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-white/30 uppercase tracking-wider">Playing as</p>
                <button onClick={() => { soundManager.playClick(); openSettings() }} className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors">
                  <Settings size={12} />
                  Change name
                </button>
              </div>
              <p className="text-sm font-semibold text-white -mt-2 mb-1">{name}</p>
              <button onClick={handleCreate} className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400/15 to-cyan-400/5 border border-cyan-400/20 text-cyan-400 text-sm font-semibold flex items-center justify-center gap-2 hover:from-cyan-400/25 hover:to-cyan-400/10 transition-all active:scale-[0.98]">
                <Plus size={16} />
                Create Room
                <ArrowRight size={14} className="ml-auto" />
              </button>
              <button onClick={() => { soundManager.playClick(); setMode('join') }} className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/[0.09] transition-all active:scale-[0.98]">
                <LogIn size={16} />
                Join Room
                <ArrowRight size={14} className="ml-auto" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-4">Enter room code</p>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="ABCD"
                  maxLength={8}
                  autoFocus
                  className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 pr-12 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-400/30 transition-colors font-mono tracking-widest text-center uppercase"
                />
                <button onClick={handlePaste} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.1] transition-all" title="Paste from clipboard">
                  {pasteSuccess ? <Check size={14} className="text-emerald-400" /> : <ClipboardPaste size={14} />}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { soundManager.playClick(); setMode('home') }} className="flex-1 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 text-sm font-semibold hover:bg-white/[0.09] transition-all active:scale-[0.98]">
                  Back
                </button>
                <button onClick={handleJoin} disabled={joinCode.trim().length < 4} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-400/15 to-cyan-400/5 border border-cyan-400/20 text-cyan-400 text-sm font-semibold hover:from-cyan-400/25 hover:to-cyan-400/10 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  Join
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center text-[11px] text-white/20 mt-6">
          Built with Three.js · Firebase · Next.js
        </motion.p>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 pointer-events-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-3xl border border-white/[0.08] bg-black/80 backdrop-blur-2xl p-6 text-center max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-3 text-left">Display Name</p>
            <input type="text" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveSettings()} placeholder="Your name..." maxLength={15} autoFocus className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-400/30 transition-colors mb-4" />
            <button onClick={saveSettings} disabled={!settingsName.trim()} className="w-full h-11 rounded-xl bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-400/25 transition-all active:scale-[0.98] disabled:opacity-30">
              Save
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
