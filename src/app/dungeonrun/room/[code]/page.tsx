'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { checkPlatformerRoomExists, joinPlatformerRoom } from '@/game/systems/NetworkSync'

const DungeonRun = dynamic(() => import('@/game/DungeonRun'), { ssr: false })

export default function DungeonRunRoomPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = (params?.code as string) || ''
  const isHost = searchParams.get('host') === '1'

  const [playerId, setPlayerId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    try {
      let id = localStorage.getItem('xo playerId')
      if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('xo playerId', id)
      }
      setPlayerId(id)
      const name = localStorage.getItem('xo playerName') || 'Player'
      setPlayerName(name)
    } catch {
      setPlayerId(crypto.randomUUID())
      setPlayerName('Player')
    }
  }, [])

  useEffect(() => {
    if (!code || !playerId || initRef.current) return
    initRef.current = true

    const init = async () => {
      const exists = await checkPlatformerRoomExists(code)
      if (!exists) {
        setError('Room not found.')
        return
      }
      if (!isHost) {
        const name = localStorage.getItem('xo playerName') || 'Player'
        const joined = await joinPlatformerRoom(code, playerId, name)
        if (!joined) {
          setError('Unable to join room. It may be full or has already started.')
          return
        }
      }
      setReady(true)
    }
    init()
  }, [code, playerId, isHost])

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
        <div className="flex flex-col items-center gap-4 px-6 text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-2xl text-red-400" role="img" aria-label="error">!</span>
          </div>
          <p className="text-sm text-red-400/80">{error}</p>
          <button onClick={() => router.push('/')}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-semibold hover:bg-white/10 transition-all">
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  if (!ready || !playerId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-sm text-white/50">Connecting...</p>
        </div>
      </div>
    )
  }

  return (
    <DungeonRun
      roomCode={code}
      playerId={playerId}
      playerName={playerName}
      isHost={isHost}
      onBack={() => router.push('/')}
    />
  )
}
