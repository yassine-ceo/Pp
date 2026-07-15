export type PlayerSymbol = 'X' | 'O'
export type RoomStatus = 'waiting' | 'playing' | 'won' | 'tie' | 'terminated'

export interface Player {
  id: string
  name: string
  symbol: PlayerSymbol
}

export interface ChatMessage {
  id: string
  playerId: string
  playerName: string
  type: 'emoji' | 'text'
  content: string
  timestamp: number
}

export interface ChatBubble {
  id: string
  playerId: string
  playerName: string
  content: string
  timestamp: number
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
  winLine?: number[] | null
  turnStartTime?: number | null
  chat?: Record<string, ChatMessage>
  bubbles?: Record<string, ChatBubble>
}

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export const EMPTY_BOARD = Array(9).fill('') as string[]

export const CHAT_EMOJIS = [
  { id: 'laugh', label: 'Laugh' },
  { id: 'clown', label: 'Clown' },
  { id: 'angry', label: 'Angry' },
  { id: 'cry', label: 'Cry' },
  { id: 'shock', label: 'Shocked' },
] as const

export type EmojiId = typeof CHAT_EMOJIS[number]['id']

export const TURN_TIME_LIMIT = 20_000
