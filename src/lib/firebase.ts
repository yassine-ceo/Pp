import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, update, remove, onDisconnect, serverTimestamp } from 'firebase/database'
import type { Room, Player, RoomStatus } from './types'
import { EMPTY_BOARD } from './types'

const firebaseConfig = {
  apiKey: 'AIzaSyC8QzqPBo7BCpXW8NmS9tmQ0utEHJP-C7k',
  authDomain: 'xo-online-e3d71.firebaseapp.com',
  databaseURL: 'https://xo-online-e3d71-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'xo-online-e3d71',
  storageBucket: 'xo-online-e3d71.firebasestorage.app',
  messagingSenderId: '303343939745',
  appId: '1:303343939745:web:7706e789c3ee7a62d480e0',
  measurementId: 'G-MV4Y3ME2P5',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createRoom(hostName: string, playerId: string): Promise<string> {
  const code = generateRoomCode()
  const roomRef = ref(db, `rooms/${code}`)
  const host: Player = { id: playerId, name: hostName, symbol: 'X' }
  const room: Room = {
    code,
    status: 'waiting',
    players: { p1: host, p2: null },
    board: [...EMPTY_BOARD],
    turn: null,
    winner: null,
    winnerName: null,
    createdAt: Date.now(),
    scores: { p1: 0, p2: 0 },
  }
  await set(roomRef, room)
  setupPresence(code, playerId)
  return code
}

export async function joinRoom(code: string, playerName: string, playerId: string): Promise<Room | null> {
  const roomRef = ref(db, `rooms/${code}`)
  const snap = await new Promise<import('firebase/database').DataSnapshot>((resolve) => {
    onValue(roomRef, (s) => resolve(s), { onlyOnce: true })
  })
  if (!snap.exists()) return null
  const data = snap.val() as Room
  if (data.players.p2) return null

  const joiner: Player = { id: playerId, name: playerName, symbol: 'O' }
  await update(roomRef, {
    'players/p2': joiner,
    status: 'playing',
    turn: data.players.p1?.id ?? null,
  })
  setupPresence(code, playerId)
  const updated = await new Promise<import('firebase/database').DataSnapshot>((resolve) => {
    onValue(roomRef, (s) => resolve(s), { onlyOnce: true })
  })
  return updated.val() as Room
}

export async function reconnectToRoom(code: string, playerId: string): Promise<Room | null> {
  const roomRef = ref(db, `rooms/${code}`)
  const snap = await new Promise<import('firebase/database').DataSnapshot>((resolve) => {
    onValue(roomRef, (s) => resolve(s), { onlyOnce: true })
  })
  if (!snap.exists()) return null
  const data = snap.val() as Room
  const isP1 = data.players.p1?.id === playerId
  const isP2 = data.players.p2?.id === playerId
  if (!isP1 && !isP2) return null
  setupPresence(code, playerId)
  return data
}

function setupPresence(roomCode: string, playerId: string) {
  const connectedRef = ref(db, '.info/connected')
  const playerPresenceRef = ref(db, `rooms/${roomCode}/presence/${playerId}`)

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      set(playerPresenceRef, { online: true, lastSeen: serverTimestamp() })
      onDisconnect(playerPresenceRef).remove()
      onDisconnect(ref(db, `rooms/${roomCode}/status`)).set('terminated')
    }
  })
}

export function subscribeToRoom(code: string, callback: (room: Room | null) => void) {
  const roomRef = ref(db, `rooms/${code}`)
  return onValue(roomRef, (snap) => {
    callback(snap.exists() ? (snap.val() as Room) : null)
  })
}

export function checkWin(board: string[]): { won: boolean; line: number[] | null; symbol: string | null; tie: boolean } {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { won: true, line: [a, b, c], symbol: board[a], tie: false }
    }
  }
  const tie = board.every((cell) => cell !== '')
  return { won: false, line: null, symbol: null, tie }
}

export async function makeMove(code: string, playerId: string, index: number, board: string[], turn: string | null) {
  if (board[index] !== '' || turn !== playerId) return false
  const newBoard = [...board]
  const roomSnap = await new Promise<import('firebase/database').DataSnapshot>((resolve) => {
    onValue(ref(db, `rooms/${code}`), (s) => resolve(s), { onlyOnce: true })
  })
  const room = roomSnap.val() as Room
  const symbol = room.players.p1?.id === playerId ? 'X' : 'O'
  newBoard[index] = symbol

  const result = checkWin(newBoard)
  let newStatus: RoomStatus = 'playing'
  let winnerId: string | null = null
  let winnerName: string | null = null

  if (result.won) {
    newStatus = 'won'
    winnerId = playerId
    winnerName = room.players.p1?.id === playerId ? room.players.p1?.name ?? null : room.players.p2?.name ?? null
  } else if (result.tie) {
    newStatus = 'tie'
  }

  const nextTurn = newStatus === 'playing'
    ? (turn === room.players.p1?.id ? room.players.p2?.id : room.players.p1?.id)
    : turn

  const updates: Record<string, unknown> = {
    board: newBoard,
    turn: nextTurn,
    status: newStatus,
    winner: winnerId,
    winnerName,
  }

  if (newStatus === 'won' || newStatus === 'tie') {
    const scores = { ...room.scores }
    if (newStatus === 'won') {
      if (winnerId === room.players.p1?.id) scores.p1++
      else scores.p2++
    }
    updates.scores = scores
  }

  await update(ref(db, `rooms/${code}`), updates)
  return { won: result.won, tie: result.tie, symbol }
}

export async function updateRoomStatus(code: string, status: RoomStatus) {
  await update(ref(db, `rooms/${code}`), { status })
}

export async function deleteRoom(code: string) {
  await remove(ref(db, `rooms/${code}`))
}
