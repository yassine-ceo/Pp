export type PlayerSymbol = 'X' | 'O'
export type RoomStatus = 'waiting' | 'playing' | 'won' | 'tie' | 'terminated'

export interface Player {
  id: string
  name: string
  symbol: PlayerSymbol
}

export interface Room {
  code: string
  status: RoomStatus
  players: {
    p1: Player | null
    p2: Player | null
  }
  board: string[]
  turn: string | null
  winner: string | null
  winnerName: string | null
  createdAt: number
  scores: { p1: number; p2: number }
  ready?: Record<string, boolean>
  rematchTimerStart?: number
}

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export const EMPTY_BOARD = Array(9).fill('') as string[]
