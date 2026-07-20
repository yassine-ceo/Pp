'use client'

export type PlatformerRoomStatus = 'waiting' | 'countdown' | 'playing' | 'finished'

export interface PlayerState {
  id: string
  name: string
  x: number
  y: number
  vx: number
  vy: number
  grounded: boolean
  facing: number
  roomId: string
}

export interface PlatformerRoom {
  code: string
  status: PlatformerRoomStatus
  hostId: string
  players: Record<string, PlayerState>
  level: number
  createdAt: number
}

export type GamepadAction = 'left' | 'right' | 'jump' | 'attack' | 'shield'

export interface InputState {
  left: boolean
  right: boolean
  jump: boolean
  attack: boolean
  shield: boolean
}
