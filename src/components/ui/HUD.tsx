'use client'

import { useGameStore } from '@/stores/gameStore'
import { soundManager } from '@/lib/sound'
import { Trophy, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function HUD() {
  const { room, playerId } = useGameStore()
  const [muted, setMuted] = useState(false)

  if (!room || !playerId) return null

  const me = room.players.p1?.id === playerId ? room.players.p1 : room.players.p2
  const opponent = room.players.p1?.id === playerId ? room.players.p2 : room.players.p1
  const isMyTurn = room.turn === playerId
  const mySymbol = me?.symbol ?? 'X'
  const oppSymbol = mySymbol === 'X' ? 'O' : 'X'

  return (
    <>
      {/* Top HUD */}
      <div className="fixed top-0 inset-x-0 z-20 px-4 pt-4 pointer-events-none">
        <div className="mx-auto max-w-lg flex items-center justify-between gap-3">
          {/* Me */}
          <div className="pointer-events-auto rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-xl px-3 py-2 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              mySymbol === 'X' ? 'bg-cyan-400/15 text-cyan-400' : 'bg-rose-400/15 text-rose-400'
            }`}>
              {mySymbol}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white truncate max-w-[80px]">{me?.name ?? 'You'}</p>
              {isMyTurn && room.status === 'playing' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[9px] text-cyan-400 font-medium"
                >
                  Your turn
                </motion.p>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="pointer-events-auto rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-xl px-4 py-2 text-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-cyan-400">{room.scores.p1}</span>
              <span className="text-white/20 text-xs">—</span>
              <span className="text-sm font-bold text-rose-400">{room.scores.p2}</span>
            </div>
            <p className="text-[9px] text-white/30 mt-0.5">SCORE</p>
          </div>

          {/* Opponent */}
          <div className="pointer-events-auto rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-xl px-3 py-2 flex items-center gap-2">
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-semibold text-white truncate max-w-[80px]">{opponent?.name ?? 'Waiting...'}</p>
              {!opponent && room.status === 'waiting' && (
                <p className="text-[9px] text-amber-400/70 font-medium">Code: {room.code}</p>
              )}
            </div>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
              oppSymbol === 'X' ? 'bg-cyan-400/15 text-cyan-400' : 'bg-rose-400/15 text-rose-400'
            }`}>
              {oppSymbol}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — room code + mute */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-4 pb-4 pointer-events-none">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div className="pointer-events-auto rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-xl px-3 py-2">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Room</p>
            <p className="text-sm font-bold text-white tracking-[0.2em]">{room.code}</p>
          </div>
          <button
            onClick={() => {
              soundManager.playClick()
              const next = !muted
              setMuted(next)
              soundManager.setMuted(next)
            }}
            className="pointer-events-auto w-10 h-10 rounded-xl border border-white/[0.08] bg-black/40 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* Waiting overlay — interactive */}
      {room.status === 'waiting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl px-8 py-8 text-center max-w-sm mx-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-400/10 flex items-center justify-center">
              <Trophy size={24} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Waiting for opponent</h2>
            <p className="text-sm text-white/50 mb-5">Share this room code with your friend:</p>
            <div className="rounded-xl bg-white/[0.06] border border-white/[0.08] px-6 py-4 mb-4">
              <p className="text-3xl font-mono font-bold text-white tracking-[0.3em]">{room.code}</p>
            </div>
            <p className="text-xs text-white/30">Expires in 5 minutes if not joined</p>
          </div>
        </motion.div>
      )}

      {/* Win/Lose/Tie overlay — interactive */}
      {(room.status === 'won' || room.status === 'tie') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
        >
          <div className="rounded-2xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl px-8 py-8 text-center max-w-sm mx-4">
            {room.status === 'tie' ? (
              <>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
                  <span className="text-2xl">🤝</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">It&apos;s a Tie!</h2>
              </>
            ) : room.winner === playerId ? (
              <>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-400/10 flex items-center justify-center">
                  <Trophy size={24} className="text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold text-cyan-400 mb-2">You Win!</h2>
              </>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-400/10 flex items-center justify-center">
                  <span className="text-2xl">😔</span>
                </div>
                <h2 className="text-xl font-bold text-rose-400 mb-2">You Lose</h2>
              </>
            )}
          </div>
        </motion.div>
      )}
    </>
  )
}
