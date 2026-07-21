'use client'

import { ref, set, update, onValue, off, remove, get, child } from 'firebase/database'
import { db } from '@/lib/firebase'
import type { PlatformerRoom, PlayerState } from '../types'

const ROOMS_PATH = 'platformerRooms'

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function checkPlatformerRoomExists(code: string): Promise<boolean> {
  try {
    const snap = await get(child(ref(db), `${ROOMS_PATH}/${code}/status`))
    return snap.exists()
  } catch {
    return false
  }
}

export async function createPlatformerRoom(hostId: string, hostName: string): Promise<string> {
  const code = generateRoomCode()
  const roomRef = ref(db, `${ROOMS_PATH}/${code}`)
  const playerState: PlayerState = {
    id: hostId,
    name: hostName,
    x: 160,
    y: 200,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    hp: 100,
    lastShootTime: 0,
    shootFacing: 1,
    roomId: code,
  }
  const room: PlatformerRoom = {
    code,
    status: 'waiting',
    hostId,
    players: { [hostId]: playerState },
    level: 1,
    createdAt: Date.now(),
  }
  await set(roomRef, room)
  return code
}

export async function joinPlatformerRoom(code: string, playerId: string, playerName: string): Promise<boolean> {
  const roomRef = ref(db, `${ROOMS_PATH}/${code}`)
  try {
    const snap = await get(roomRef)
    if (!snap.exists()) return false
    const room = snap.val() as PlatformerRoom
    if (room.status !== 'waiting' && room.status !== 'starting') return false
    const players = room.players || {}
    if (players[playerId]) return true
    if (Object.keys(players).length >= 2) return false

    const playerState: PlayerState = {
      id: playerId,
      name: playerName,
      x: 640,
      y: 200,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: -1,
      hp: 100,
      lastShootTime: 0,
      shootFacing: -1,
      roomId: code,
    }
    await update(roomRef, { [`players/${playerId}`]: playerState })
    return true
  } catch {
    return false
  }
}

export function subscribePlatformerRoom(code: string, cb: (room: PlatformerRoom | null) => void): () => void {
  const roomRef = ref(db, `${ROOMS_PATH}/${code}`)
  const handler = onValue(roomRef, (snap) => {
    const data = snap.val()
    if (!data) { cb(null); return }
    cb(data as PlatformerRoom)
  })
  return () => off(roomRef, 'value', handler)
}

export async function updatePlayerPosition(code: string, playerId: string, state: Partial<PlayerState>): Promise<void> {
  const ref_path = ref(db, `${ROOMS_PATH}/${code}/players/${playerId}`)
  await update(ref_path, state)
}

export async function setRoomStatus(code: string, status: PlatformerRoom['status']): Promise<void> {
  const roomRef = ref(db, `${ROOMS_PATH}/${code}`)
  await update(roomRef, { status })
}

export async function deletePlatformerRoom(code: string): Promise<void> {
  const roomRef = ref(db, `${ROOMS_PATH}/${code}`)
  await remove(roomRef)
}
