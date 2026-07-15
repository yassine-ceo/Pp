'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import {
  createRoom,
  joinRoom,
  subscribeToRoom,
  deleteRoom,
  terminateRoom,
  makeMove,
} from '@/lib/firebase'
import { TURN_TIME_LIMIT } from '@/lib/types'
import { soundManager } from '@/lib/sound'
import GameScene from '@/components/3d/GameScene'
import HUD from '@/components/ui/HUD'

const REMATCH_TIMEOUT = 30_000
const WIN_DELAY_MS = 3000

function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem('xo playerId')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('xo playerId', id)
    }
    return id
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const urlCode = (params?.code as string) || ''
  const {
    room, setRoom, setRoomId,
    playerId, setPlayerId, playerName, setPlayerName,
    localBoard,
    addWin, addLoss, addTie,
    setShowResult, setWinHighlightCells, applyOptimisticMove,
  } = useGameStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [terminated, setTerminated] = useState(false)
  const unsubRef = useRef<() => void | null>(null)
  const roomCodeRef = useRef<string | null>(null)
  const prevStatusRef = useRef<string | null>(null)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rematchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const winDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initDoneRef = useRef(false)

  const cleanup = useCallback(async () => {
    if (roomCodeRef.current) {
      try { await deleteRoom(roomCodeRef.current) } catch {}
      roomCodeRef.current = null
    }
  }, [])

  // Initialize player identity (name only from localStorage)
  useEffect(() => {
    try {
      const id = getOrCreatePlayerId()
      setPlayerId(id)
      const savedName = localStorage.getItem('xo playerName') || 'Player'
      setPlayerName(savedName)
    } catch {
      setPlayerId(Math.random().toString(36).slice(2))
      setPlayerName('Player')
    }
  }, [setPlayerId, setPlayerName])

  // Create or join (NO reconnect)
  useEffect(() => {
    if (!playerId || !playerName || !urlCode || initDoneRef.current) return
    initDoneRef.current = true

    const init = async () => {
      try {
        if (urlCode === 'create') {
          const newCode = await createRoom(playerName, playerId)
          roomCodeRef.current = newCode
          setRoomId(newCode)
          window.history.replaceState(null, '', `/room/${newCode}`)

          expiryTimerRef.current = setTimeout(async () => {
            const { room: currentRoom } = useGameStore.getState()
            if (currentRoom?.status === 'waiting') {
              setTerminated(true)
              setError('Invite expired. Room was not joined in time.')
              soundManager.playDisconnect()
            }
          }, 5 * 60 * 1000)
        } else {
          const joined = await joinRoom(urlCode, playerName, playerId)
          if (joined) {
            roomCodeRef.current = urlCode
            setRoomId(urlCode)
          } else {
            setError('Room not found or already full.')
            setLoading(false)
            return
          }
        }
        setLoading(false)
      } catch (error) {
        console.error('Room init error:', error)
        setError('Failed to connect. Please try again.')
        setLoading(false)
      }
    }
    init()

    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
      if (rematchTimerRef.current) clearTimeout(rematchTimerRef.current)
      if (winDelayRef.current) clearTimeout(winDelayRef.current)
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current)
    }
  }, [playerId, playerName, urlCode, setRoomId, cleanup])

  // Subscribe to room
  useEffect(() => {
    if (!roomCodeRef.current) return
    const code = roomCodeRef.current

    const unsub = subscribeToRoom(code, (data) => {
      if (!data) {
        setTerminated(true)
        setError('Room was closed.')
        soundManager.playDisconnect()
        setRoom(null)
        return
      }

      const prev = prevStatusRef.current
      const newStatus = data?.status

      // Detect win/lose/tie with 3s delay
      if (prev === 'playing' && (newStatus === 'won' || newStatus === 'tie')) {
        if (autoPlayRef.current) { clearTimeout(autoPlayRef.current); autoPlayRef.current = null }
        const winLine = data?.winLine ?? []
        setWinHighlightCells(winLine)

        if (newStatus === 'won') {
          if (data?.winner === playerId) { soundManager.playWin(); addWin() }
          else { soundManager.playTie(); addLoss() }
        } else {
          soundManager.playTie(); addTie()
        }

        setShowResult(false)
        if (winDelayRef.current) clearTimeout(winDelayRef.current)
        winDelayRef.current = setTimeout(() => setShowResult(true), WIN_DELAY_MS)
      }

      // Reset on new game - force fresh board from Firebase (ignore local optimistic board)
      if ((prev === 'won' || prev === 'tie') && newStatus === 'playing') {
        setWinHighlightCells([])
        setShowResult(false)
        useGameStore.getState().setLocalBoard([...data.board])
      }

      // Detect disconnect
      if (prev === 'playing' && newStatus === 'terminated') {
        if (autoPlayRef.current) { clearTimeout(autoPlayRef.current); autoPlayRef.current = null }
        setTerminated(true)
        setError('Opponent left the game.')
        soundManager.playDisconnect()
      }

      // Detect rematch timeout
      if ((prev === 'won' || prev === 'tie') && newStatus === 'terminated') {
        setTerminated(true)
        setError('Rematch timed out!')
      }

      prevStatusRef.current = newStatus
      setRoom(data)
    })

    unsubRef.current = unsub
    return () => { unsub() }
  }, [roomCodeRef.current, playerId, setRoom, addWin, addLoss, addTie, setShowResult, setWinHighlightCells])

  // Auto-play timer (20s turn timeout)
  useEffect(() => {
    if (autoPlayRef.current) { clearTimeout(autoPlayRef.current); autoPlayRef.current = null }

    if (!room || room.status !== 'playing' || !room.turn || !room.turnStartTime) return
    if (room.turn !== playerId) return

    const elapsed = Date.now() - room.turnStartTime
    const remaining = Math.max(0, TURN_TIME_LIMIT - elapsed)

    if (remaining <= 0) {
      // Already expired, auto-play immediately
      autoPlayRandom()
      return
    }

    autoPlayRef.current = setTimeout(() => {
      autoPlayRandom()
    }, remaining)

    return () => { if (autoPlayRef.current) clearTimeout(autoPlayRef.current) }
  }, [room?.turn, room?.turnStartTime, room?.status, playerId])

  const autoPlayRandom = useCallback(async () => {
    const { room: currentRoom, playerId: pid, localBoard: lb, applyOptimisticMove: apply } = useGameStore.getState()
    if (!currentRoom || !pid || currentRoom.status !== 'playing' || currentRoom.turn !== pid) return
    if (!roomCodeRef.current) return

    const emptyCells = lb.map((cell, i) => cell === '' ? i : -1).filter((i) => i >= 0)
    if (emptyCells.length === 0) return

    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const symbol = currentRoom.players?.p1?.id === pid ? 'X' : 'O'

    apply(randomIndex, symbol)
    if (symbol === 'X') soundManager.playPlaceX()
    else soundManager.playPlaceO()

    await makeMove(roomCodeRef.current, pid, randomIndex, currentRoom.board, currentRoom.turn)
  }, [])

  // Monitor rematch timer expiry
  useEffect(() => {
    if (!room || !roomCodeRef.current) return
    if (room?.status !== 'won' && room?.status !== 'tie') {
      if (rematchTimerRef.current) clearTimeout(rematchTimerRef.current)
      return
    }
    const timerStart = room?.rematchTimerStart
    if (!timerStart) return

    const remaining = REMATCH_TIMEOUT - (Date.now() - timerStart)
    if (remaining <= 0) {
      terminateRoom(roomCodeRef.current).catch(() => {})
      return
    }

    rematchTimerRef.current = setTimeout(() => {
      if (roomCodeRef.current) terminateRoom(roomCodeRef.current).catch(() => {})
    }, remaining + 500)

    return () => { if (rematchTimerRef.current) clearTimeout(rematchTimerRef.current) }
  }, [room?.status, room?.rematchTimerStart])

  const handleBack = useCallback(async () => {
    soundManager.playClick()
    if (roomCodeRef.current) {
      try { await deleteRoom(roomCodeRef.current) } catch {}
    }
    setRoom(null)
    setRoomId(null)
    setWinHighlightCells([])
    setShowResult(false)
    router.push('/')
  }, [setRoom, setRoomId, setWinHighlightCells, setShowResult, router])

  return (
    <>
      <GameScene />
      <div className="fixed inset-0 z-[1] bg-[#0a0a1a]/30 pointer-events-none" />

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-sm text-white/50">Connecting...</p>
          </div>
        </div>
      )}

      {(error || terminated) && !room && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-5 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl p-8 text-center max-w-sm w-full"
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-400/10 border border-rose-400/15 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
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

      {!loading && room && <HUD />}

      {!loading && room?.status === 'playing' && (
        <button
          onClick={handleBack}
          className="fixed top-10 left-4 z-30 w-10 h-10 rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-colors pointer-events-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </>
  )
}
