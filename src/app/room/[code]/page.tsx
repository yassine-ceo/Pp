'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import {
  createRoom,
  joinRoom,
  subscribeToRoom,
  deleteRoom,
  checkWin,
} from '@/lib/firebase'
import { soundManager } from '@/lib/sound'
import GameScene from '@/components/3d/GameScene'
import HUD from '@/components/ui/HUD'

function generatePlayerId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const {
    room, setRoom, setRoomId, roomId,
    playerId, setPlayerId, playerName, setPlayerName,
    addWin, addLoss, addTie,
  } = useGameStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [terminated, setTerminated] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)
  const roomCodeRef = useRef<string | null>(null)
  const prevStatusRef = useRef<string | null>(null)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(async () => {
    if (roomCodeRef.current) {
      try { await deleteRoom(roomCodeRef.current) } catch {}
      roomCodeRef.current = null
    }
  }, [])

  // Initialize player ID and name
  useEffect(() => {
    let id = localStorage.getItem('xo playerId')
    if (!id) {
      id = generatePlayerId()
      localStorage.setItem('xo playerId', id)
    }
    setPlayerId(id)

    const savedName = localStorage.getItem('xo playerName') || 'Player'
    setPlayerName(savedName)
  }, [setPlayerId, setPlayerName])

  // Create or join room
  useEffect(() => {
    if (!playerId || !playerName || !code) return
    if (roomCodeRef.current) return

    const init = async () => {
      try {
        if (code === 'create') {
          const newCode = await createRoom(playerName, playerId)
          roomCodeRef.current = newCode
          setRoomId(newCode)
          window.history.replaceState(null, '', `/room/${newCode}`)

          // 5-minute expiry for waiting rooms
          expiryTimerRef.current = setTimeout(async () => {
            const { room: currentRoom } = useGameStore.getState()
            if (currentRoom?.status === 'waiting') {
              setTerminated(true)
              setError('Invite expired. Room was not joined in time.')
              soundManager.playDisconnect()
              await cleanup()
            }
          }, 5 * 60 * 1000)
        } else {
          const joined = await joinRoom(code, playerName, playerId)
          if (!joined) {
            setError('Room not found or already full.')
            setLoading(false)
            return
          }
          roomCodeRef.current = code
          setRoomId(code)
        }
        setLoading(false)
      } catch (err) {
        setError('Failed to connect. Please try again.')
        setLoading(false)
      }
    }
    init()

    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
    }
  }, [playerId, playerName, code, setRoomId, cleanup])

  // Subscribe to room changes
  useEffect(() => {
    if (!roomCodeRef.current) return
    const code = roomCodeRef.current

    const unsub = subscribeToRoom(code, (data) => {
      if (!data) {
        setTerminated(true)
        setError('Opponent left the game.')
        soundManager.playDisconnect()
        setRoom(null)
        return
      }

      const prev = prevStatusRef.current
      const newStatus = data.status

      // Detect win/lose/tie transitions
      if (prev === 'playing' && (newStatus === 'won' || newStatus === 'tie')) {
        if (newStatus === 'won') {
          if (data.winner === playerId) {
            soundManager.playWin()
            addWin()
          } else {
            soundManager.playTie()
            addLoss()
          }
        } else {
          soundManager.playTie()
          addTie()
        }
      }

      // Detect opponent disconnect
      if (prev === 'playing' && newStatus === 'terminated') {
        setTerminated(true)
        setError('Opponent left the game.')
        soundManager.playDisconnect()
      }

      prevStatusRef.current = newStatus
      setRoom(data)
    })

    unsubRef.current = unsub
    return () => { unsub() }
  }, [roomCodeRef.current, playerId, setRoom, addWin, addLoss, addTie])

  // beforeunload handler
  useEffect(() => {
    const handler = () => { cleanup() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [cleanup])

  const handleBack = () => {
    soundManager.playClick()
    cleanup()
    setRoom(null)
    setRoomId(null)
    router.push('/')
  }

  const isPlaying = room?.status === 'playing' || room?.status === 'won' || room?.status === 'tie'

  return (
    <>
      {/* 3D Scene */}
      <GameScene isPlaying={isPlaying} />

      {/* Dark overlay */}
      <div className="fixed inset-0 z-[1] bg-[#0a0a1a]/30" />

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-sm text-white/50">Connecting...</p>
          </div>
        </div>
      )}

      {/* Error / Terminated */}
      {(error || terminated) && !room && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl p-8 text-center max-w-sm w-full"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-400/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              {terminated ? 'Game Ended' : 'Error'}
            </h2>
            <p className="text-sm text-white/50 mb-6">{error || 'Something went wrong.'}</p>
            <button
              onClick={handleBack}
              className="w-full h-11 rounded-xl bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-400/25 transition-all"
            >
              Back to Menu
            </button>
          </motion.div>
        </div>
      )}

      {/* HUD overlay */}
      {!loading && room && <HUD />}

      {/* Back button (always visible during game) */}
      {!loading && (room?.status === 'playing' || room?.status === 'won' || room?.status === 'tie') && (
        <button
          onClick={handleBack}
          className="fixed top-4 left-4 z-30 w-10 h-10 rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Play Again button after win/lose/tie */}
      {(room?.status === 'won' || room?.status === 'tie') && (
        <div className="fixed bottom-20 inset-x-0 z-30 flex justify-center px-5">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            onClick={handleBack}
            className="rounded-xl bg-cyan-400/15 border border-cyan-400/20 text-cyan-400 text-sm font-semibold px-8 py-3 hover:bg-cyan-400/25 transition-all active:scale-[0.98]"
          >
            Play Again
          </motion.button>
        </div>
      )}
    </>
  )
}
