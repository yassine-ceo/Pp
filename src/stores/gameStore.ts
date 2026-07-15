'use client'

import { create } from 'zustand'
import type { Room, Player } from '@/lib/types'
import { EMPTY_BOARD } from '@/lib/types'

interface GameState {
  roomId: string | null
  room: Room | null
  playerId: string | null
  playerName: string
  scores: { p1: number; p2: number }
  setPlayerName: (name: string) => void
  setPlayerId: (id: string) => void
  setRoom: (room: Room | null) => void
  setRoomId: (id: string | null) => void
  resetGame: () => void
  localWins: number
  localLosses: number
  localTies: number
  addWin: () => void
  addLoss: () => void
  addTie: () => void
}

export const useGameStore = create<GameState>((set) => ({
  roomId: null,
  room: null,
  playerId: null,
  playerName: '',
  scores: { p1: 0, p2: 0 },
  localWins: 0,
  localLosses: 0,
  localTies: 0,
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerId: (id) => set({ playerId: id }),
  setRoom: (room) => set({ room, scores: room?.scores ?? { p1: 0, p2: 0 } }),
  setRoomId: (id) => set({ roomId: id }),
  resetGame: () => set({ room: null, roomId: null }),
  addWin: () => set((s) => ({ localWins: s.localWins + 1 })),
  addLoss: () => set((s) => ({ localLosses: s.localLosses + 1 })),
  addTie: () => set((s) => ({ localTies: s.localTies + 1 })),
}))
