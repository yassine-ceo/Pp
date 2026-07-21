'use client'

import { useEffect, useRef } from 'react'
import * as Phaser from 'phaser'
import {
  subscribePlatformerRoom,
  updatePlayerPosition,
  setRoomStatus,
} from './systems/NetworkSync'

interface VanillaGameProps {
  roomCode: string
  playerId: string
  playerName: string
  isHost: boolean
  onRemoteJoin: () => void
  onLevelStart: () => void
  onError: (msg: string) => void
}

const SCRIPT_SRC = '/assets/FullGame/javascript/game-multiplayer.js'

export default function VanillaGame({ roomCode, playerId, playerName, isHost, onRemoteJoin, onLevelStart, onError }: VanillaGameProps) {
  const containerId = 'vanilla-game-container'
  const cleanupRef = useRef(false)

  useEffect(() => {
    cleanupRef.current = false

    // Expose Phaser globally for the vanilla script
    ;(window as any).Phaser = Phaser

    // Tell the game script which container to render into
    ;(window as any).__GAME_CONFIG = { parent: containerId }

    // Tell the game script about the current room and player
    ;(window as any).__multiplayer = { roomCode, playerId, playerName, isHost }

    // Called by the game script once its scene is fully created
    const onGameReady = () => {
      onLevelStart()
    }
    ;(window as any).__onGameReady = onGameReady

    // Subscribe to Firebase room for remote player data
    const unsub = subscribePlatformerRoom(roomCode, (room) => {
      if (cleanupRef.current || !room) return

      const otherPlayers = Object.entries(room.players).filter(([id]) => id !== playerId)
      if (otherPlayers.length > 0) {
        onRemoteJoin()
        const [, remoteState] = otherPlayers[0]
        const api = (window as any).__multiplayerAPI
        if (api) {
          api.setRemotePosition(remoteState.x, remoteState.y, remoteState.facing)
        }
      } else {
        const api = (window as any).__multiplayerAPI
        if (api) api.clearRemotePlayer()
      }

      // Host auto-starts when guest joins
      if (isHost && room.status === 'waiting' && otherPlayers.length >= 1) {
        setRoomStatus(roomCode, 'starting').catch(() => {})
      }
    })

    // Sync loop: send local player state to Firebase every frame (throttled)
    let syncRunning = true
    const syncLoop = () => {
      if (!syncRunning || cleanupRef.current) return
      const localState = (window as any).__localState
      if (localState) {
        updatePlayerPosition(roomCode, playerId, localState).catch(() => {})
      }
      requestAnimationFrame(syncLoop)
    }

    // Load the vanilla game script
    const existingScript = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existingScript) {
      // Script already loaded; just init
      syncLoop()
    } else {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.onload = () => {
        syncLoop()
      }
      document.head.appendChild(script)
    }

    return () => {
      cleanupRef.current = true
      syncRunning = false
      unsub()

      // Destroy the Phaser game
      try {
        const g = (window as any).game
        if (g && typeof g.destroy === 'function') {
          g.destroy(true)
        }
      } catch { /* ignore */ }

      // Clean up globals
      delete (window as any).__multiplayer
      delete (window as any).__onGameReady
      delete (window as any).__localState
      delete (window as any).__multiplayerAPI
      delete (window as any).__GAME_CONFIG

      // Remove the script tag so it re-executes on remount
      const tag = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
      if (tag) tag.remove()
    }
  }, [roomCode, playerId, playerName, isHost, onRemoteJoin, onLevelStart, onError])

  return (
    <div id={containerId} className="w-full h-full absolute inset-0" style={{ touchAction: 'none' }} />
  )
}
