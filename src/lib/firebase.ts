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
    ready: {},
    winLine: null,
    turnStartTime: undefined,
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
  if (data?.players?.p2) return null

  const joiner: Player = { id: playerId, name: playerName, symbol: 'O' }
  await update(roomRef, {
    'players/p2': joiner,
    status: 'playing',
    turn: data?.players?.p1?.id ?? null,
    turnStartTime: Date.now(),
  })
  setupPresence(code, playerId)
  const updated = await new Promise<import('firebase/database').DataSnapshot>((resolve) => {
    onValue(roomRef, (s) => resolve(s), { onlyOnce: true })
  })
  return updated.val() as Room
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

export async function makeMove(
  code: string,
  playerId: string,
  index: number,
  board: string[],
  turn: string | null,
): Promise<{ won: boolean; tie: boolean; symbol: string; winLine: number[] | null } | false> {
  if (!board || board[index] !== '' || turn !== playerId) return false

  const roomSnap = await new Promise<import('firebase/database').DataSnapshot>((resolve) => {
    onValue(ref(db, `rooms/${code}`), (s) => resolve(s), { onlyOnce: true })
  })
  const room = roomSnap.val() as Room
  if (!room) return false

  const symbol = room?.players?.p1?.id === playerId ? 'X' : 'O'
  const newBoard = [...board]
  newBoard[index] = symbol

  const result = checkWin(newBoard)
  let newStatus: RoomStatus = 'playing'
  let winnerId: string | null = null
  let winnerName: string | null = null

  if (result.won) {
    newStatus = 'won'
    winnerId = playerId
    winnerName = room?.players?.p1?.id === playerId
      ? (room?.players?.p1?.name ?? null)
      : (room?.players?.p2?.name ?? null)
  } else if (result.tie) {
    newStatus = 'tie'
  }

  const nextTurn = newStatus === 'playing'
    ? (turn === room?.players?.p1?.id ? room?.players?.p2?.id : room?.players?.p1?.id)
    : turn

  const updates: Record<string, unknown> = {
    [`board/${index}`]: symbol,
    turn: nextTurn,
    status: newStatus,
    winner: winnerId,
    winnerName,
    winLine: result.line ?? null,
    turnStartTime: newStatus === 'playing' ? Date.now() : null,
  }

  if (newStatus === 'won' || newStatus === 'tie') {
    const scores = { ...(room?.scores ?? { p1: 0, p2: 0 }) }
    if (newStatus === 'won') {
      if (winnerId === room?.players?.p1?.id) scores.p1++
      else scores.p2++
    }
    updates.scores = scores
    updates.ready = {}
    updates.rematchTimerStart = null
  }

  await update(ref(db, `rooms/${code}`), updates)
  return { won: result.won, tie: result.tie, symbol, winLine: result.line }
}

export async function setReady(code: string, playerId: string): Promise<void> {
  const roomSnap = await new Promise<import('firebase/database').DataSnapshot>((resolve) => {
    onValue(ref(db, `rooms/${code}`), (s) => resolve(s), { onlyOnce: true })
  })
  const room = roomSnap.val() as Room
  if (!room) return

  const ready = { ...(room.ready ?? {}), [playerId]: true }
  const isFirstReady = Object.keys(ready).length === 1 && ready[playerId]

  const updates: Record<string, unknown> = { ready }

  if (isFirstReady) {
    updates.rematchTimerStart = Date.now()
  }

  await update(ref(db, `rooms/${code}`), updates)

  const p1Id = room?.players?.p1?.id
  const p2Id = room?.players?.p2?.id
  if (p1Id && p2Id && ready[p1Id] && ready[p2Id]) {
    const lastTurn = room?.turn
    const newFirstTurn = lastTurn === p1Id ? p2Id : p1Id
    await update(ref(db, `rooms/${code}`), {
      board: [...EMPTY_BOARD],
      status: 'playing',
      turn: newFirstTurn,
      winner: null,
      winnerName: null,
      winLine: null,
      turnStartTime: Date.now(),
      ready: {},
      rematchTimerStart: null,
      bubbles: {},
    })
  }
}

export async function terminateRoom(code: string): Promise<void> {
  await update(ref(db, `rooms/${code}`), { status: 'terminated' })
}

export async function updateRoomStatus(code: string, status: RoomStatus) {
  await update(ref(db, `rooms/${code}`), { status })
}

export async function deleteRoom(code: string) {
  await remove(ref(db, `rooms/${code}`))
}

export async function sendChatMessage(
  code: string,
  playerId: string,
  playerName: string,
  type: 'emoji' | 'text',
  content: string,
): Promise<void> {
  const msgId = `${playerId}-${Date.now()}`
  const message = {
    id: msgId,
    playerId,
    playerName,
    type,
    content,
    timestamp: Date.now(),
  }
  await update(ref(db, `rooms/${code}/chat`), { [msgId]: message })
}

export async function sendChatBubble(
  code: string,
  playerId: string,
  playerName: string,
  content: string,
): Promise<void> {
  const bubbleId = `bub-${playerId}-${Date.now()}`
  const bubble = {
    id: bubbleId,
    playerId,
    playerName,
    content,
    timestamp: Date.now(),
  }
  await update(ref(db, `rooms/${code}/bubbles`), { [bubbleId]: bubble })

  setTimeout(async () => {
    try {
      await remove(ref(db, `rooms/${code}/bubbles/${bubbleId}`))
    } catch {}
  }, 5000)
}
