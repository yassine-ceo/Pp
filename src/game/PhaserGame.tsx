'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import LobbyScene from './scenes/LobbyScene'
import Level1Scene from './scenes/Level1Scene'
import {
  subscribePlatformerRoom,
  updatePlayerPosition,
  setRoomStatus,
  deletePlatformerRoom,
} from './systems/NetworkSync'
import type { PlatformerRoom } from './types'

interface PhaserGameProps {
  roomCode: string
  playerId: string
  playerName: string
  isHost: boolean
  onRemoteJoin: () => void
  onLevelStart: () => void
  onError: (msg: string) => void
}

export default function PhaserGame({ roomCode, playerId, playerName, isHost, onRemoteJoin, onLevelStart, onError }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const lobbyRef = useRef<LobbyScene | null>(null)
  const level1Ref = useRef<Level1Scene | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)
  const cleanupRef = useRef(false)
  const currentSceneRef = useRef<'lobby' | 'level1'>('lobby')
  const transitionStartedRef = useRef(false)

  // Sync player state to Firebase
  const syncState = useCallback((data: { x: number; y: number; vx: number; vy: number; grounded: boolean; facing: number }) => {
    if (cleanupRef.current) return
    updatePlayerPosition(roomCode, playerId, {
      x: Math.round(data.x),
      y: Math.round(data.y),
      vx: Math.round(data.vx),
      vy: Math.round(data.vy),
      grounded: data.grounded,
      facing: data.facing,
    }).catch(() => {})
  }, [roomCode, playerId])

  // Subscribe to remote player
  useEffect(() => {
    cleanupRef.current = false
    transitionStartedRef.current = false

    const unsub = subscribePlatformerRoom(roomCode, (room: PlatformerRoom | null) => {
      if (cleanupRef.current || !room) return

      const otherPlayers = Object.entries(room.players).filter(([id]) => id !== playerId)
      const remoteCount = otherPlayers.length

      if (remoteCount > 0) {
        onRemoteJoin()

        // Update remote position in lobby or level1
        const [, remoteState] = otherPlayers[0]
        if (currentSceneRef.current === 'lobby' && lobbyRef.current) {
          lobbyRef.current.setRemotePosition(remoteState.x, remoteState.y, remoteState.facing)
        } else if (currentSceneRef.current === 'level1' && level1Ref.current) {
          level1Ref.current.setRemotePosition(remoteState.x, remoteState.y, remoteState.facing)
        }

        // Transition to level 1 when both are together in lobby
        if (room.status === 'waiting' && remoteCount >= 1 && !transitionStartedRef.current) {
          transitionStartedRef.current = true
          setRoomStatus(roomCode, 'countdown').catch(() => {})
          setTimeout(() => {
            if (cleanupRef.current) return
            currentSceneRef.current = 'level1'
            onLevelStart()
            const game = gameRef.current
            if (game) {
              game.scene.stop('LobbyScene')
              game.scene.start('Level1Scene')
              const l1 = game.scene.getScene('Level1Scene') as Level1Scene
              level1Ref.current = l1
              if (room.players) {
                const others = Object.entries(room.players).filter(([id]) => id !== playerId)
                if (others.length > 0) {
                  const [, state] = others[0]
                  l1.setRemotePosition(state.x, state.y, state.facing)
                }
              }
              l1.setCallbacks(syncState)
            }
            setRoomStatus(roomCode, 'playing').catch(() => {})
          }, 2000)
        }
      } else {
        if (currentSceneRef.current === 'lobby' && lobbyRef.current) {
          lobbyRef.current.setRemoteDisconnected()
        } else if (currentSceneRef.current === 'level1' && level1Ref.current) {
          level1Ref.current.setRemoteDisconnected()
        }
      }
    })

    unsubRef.current = unsub
    return () => {
      cleanupRef.current = true
      unsub()
    }
  }, [roomCode, playerId, onRemoteJoin, onLevelStart, syncState, onError])

  // Initialize Phaser
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const parent = containerRef.current
    const w = parent.clientWidth || window.innerWidth
    const h = parent.clientHeight || window.innerHeight

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: Math.min(w, 800),
      height: Math.min(h, 600),
      parent,
      backgroundColor: '#0d0806',
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [BootScene, LobbyScene, Level1Scene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: { activePointers: 3 },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    // Wait for boot then start lobby
    game.events.on('ready', () => {
      game.scene.start('LobbyScene', { roomCode, playerId, playerName, isHost })
      const lobby = game.scene.getScene('LobbyScene') as LobbyScene
      lobbyRef.current = lobby
      lobby.setCallbacks(syncState, () => {})
    })

    return () => {
      cleanupRef.current = true
      lobbyRef.current = null
      level1Ref.current = null
      game.destroy(true)
      gameRef.current = null
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
      if (isHost) {
        deletePlatformerRoom(roomCode).catch(() => {})
      }
    }
  }, [roomCode, playerId, playerName, isHost, syncState])

  // Expose control methods via imperative handle
  const setLobbyControls = useCallback((controls: { left: boolean; right: boolean; up: boolean; down: boolean }) => {
    lobbyRef.current?.setActiveControls(controls)
  }, [])

  const setLevelControls = useCallback((controls: { left: boolean; right: boolean; jump: boolean }) => {
    level1Ref.current?.setActiveControls(controls)
  }, [])

  // Store on instance for touch controls to access
  const apiRef = useRef({ setLobbyControls, setLevelControls, currentSceneRef })
  apiRef.current = { setLobbyControls, setLevelControls, currentSceneRef }

  // Expose on window for touch overlay
  useEffect(() => {
    const w = window as any
    w.__phaserControls = apiRef
    return () => { delete w.__phaserControls }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0" style={{ touchAction: 'none' }} />
  )
}
