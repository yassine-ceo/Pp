'use client'

import { create } from 'zustand'
import type { Room } from '@/lib/types'

interface GameState {
  roomId: string | null
  room: Room | null
  playerId: string | null
  playerName: string
  localBoard: string[]
  localWins: number
  localLosses: number
  localTies: number
  showResult: boolean
  winHighlightCells: number[]
  setPlayerName: (name: string) => void
  setPlayerId: (id: string) => void
  setRoom: (room: Room | null) => void
  setRoomId: (id: string | null) => void
  setLocalBoard: (board: string[]) => void
  applyOptimisticMove: (index: number, symbol: string) => void
  resetLocalBoard: () => void
  resetGame: () => void
  addWin: () => void
  addLoss: () => void
  addTie: () => void
  setShowResult: (show: boolean) => void
  setWinHighlightCells: (cells: number[]) => void
}

export const useGameStore = create<GameState>((set) => ({
  roomId: null,
  room: null,
  playerId: null,
  playerName: '',
  localBoard: Array(9).fill(''),
  localWins: 0,
  localLosses: 0,
  localTies: 0,
  showResult: false,
  winHighlightCells: [],
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerId: (id) => set({ playerId: id }),
  setRoom: (room) => {
    if (room) {
      set({ room, localBoard: [...room.board] })
    } else {
      set({ room, localBoard: Array(9).fill('') })
    }
  },
  setRoomId: (id) => set({ roomId: id }),
  setLocalBoard: (board) => set({ localBoard: board }),
  applyOptimisticMove: (index, symbol) => set((s) => {
    const board = [...s.localBoard]
    board[index] = symbol
    return { localBoard: board }
  }),
  resetLocalBoard: () => set((s) => ({
    localBoard: s.room ? [...s.room.board] : Array(9).fill('')
  })),
  resetGame: () => set({ room: null, roomId: null, localBoard: Array(9).fill('') }),
  addWin: () => set((s) => ({ localWins: s.localWins + 1 })),
  addLoss: () => set((s) => ({ localLosses: s.localLosses + 1 })),
  addTie: () => set((s) => ({ localTies: s.localTies + 1 })),
  setShowResult: (show) => set({ showResult: show }),
  setWinHighlightCells: (cells) => set({ winHighlightCells: cells }),
}))
