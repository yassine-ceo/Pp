'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

interface LobbyProps {
  playerId: string
  playerName: string
  onBack: () => void
}

interface GameProps {
  roomCode: string
  playerId: string
  playerName: string
  isHost: boolean
  onBack: () => void
}

export const LobbyEntry: ComponentType<LobbyProps> = dynamic(
  () => import('./PlatformerLobby'),
  { ssr: false },
)

export const GameEntry: ComponentType<GameProps> = dynamic(
  () => import('./DungeonRun'),
  { ssr: false },
)
