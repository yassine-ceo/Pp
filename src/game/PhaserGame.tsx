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

  const doTransition = useCallback(() => {
    if (cleanupRef.current || currentSceneRef.current === 'level1') return
    currentSceneRef.current = 'level1'
    onLevelStart()
    const game = gameRef.current
    if (!game) return
    game.scene.stop('LobbyScene')
    game.scene.start('Level1Scene')
    const l1 = game.scene.getScene('Level1Scene') as Level1Scene
    level1Ref.current = l1
    l1.setCallbacks(syncState)
  }, [onLevelStart, syncState])

  // Subscribe to Firebase room
  useEffect(() => {
    cleanupRef.current = false
    let hostHasTriggered = false

    const unsub = subscribePlatformerRoom(roomCode, (room: PlatformerRoom | null) => {
      if (cleanupRef.current || !room) return

      // Detect remote players
      const otherPlayers = Object.entries(room.players).filter(([id]) => id !== playerId)
      const remoteCount = otherPlayers.length

      if (remoteCount > 0) {
        onRemoteJoin()

        const [, remoteState] = otherPlayers[0]
        if (currentSceneRef.current === 'lobby' && lobbyRef.current) {
          lobbyRef.current.setRemotePosition(remoteState.x, remoteState.y, remoteState.facing)
        } else if (currentSceneRef.current === 'level1' && level1Ref.current) {
          level1Ref.current.setRemotePosition(remoteState.x, remoteState.y, remoteState.facing)
        }

        // Host promotes status to 'starting' when guest arrives
        if (isHost && room.status === 'waiting' && remoteCount >= 1 && !hostHasTriggered) {
          hostHasTriggered = true
          setRoomStatus(roomCode, 'starting').catch(() => {})
        }
      } else {
        // No remote player
        if (currentSceneRef.current === 'lobby' && lobbyRef.current) {
          lobbyRef.current.setRemoteDisconnected()
        } else if (currentSceneRef.current === 'level1' && level1Ref.current) {
          level1Ref.current.setRemoteDisconnected()
        }
      }

      // Both clients react to 'starting' status — synchronized transition
      if (room.status === 'starting' && currentSceneRef.current === 'lobby') {
        doTransition()
      }
    })

    unsubRef.current = unsub
    return () => {
      cleanupRef.current = true
      unsub()
    }
  }, [roomCode, playerId, isHost, onRemoteJoin, doTransition, onError])

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
        arcade: { gravity: { x: 0, y: 500 }, debug: false },
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

    game.events.on('ready', () => {
      game.scene.start('LobbyScene', { roomCode, playerId, playerName, isHost })
      const lobby = game.scene.getScene('LobbyScene') as LobbyScene
      lobbyRef.current = lobby
      lobby.setCallbacks(syncState)
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

  // Expose control methods via window for TouchControls
  const setLobbyControls = useCallback((controls: { left: boolean; right: boolean; jump: boolean }) => {
    lobbyRef.current?.setActiveControls(controls)
  }, [])

  const setLevelControls = useCallback((controls: { left: boolean; right: boolean; jump: boolean }) => {
    level1Ref.current?.setActiveControls(controls)
  }, [])

  const apiRef = useRef({ setLobbyControls, setLevelControls, currentSceneRef })
  apiRef.current = { setLobbyControls, setLevelControls, currentSceneRef }

  useEffect(() => {
    const w = window as any
    w.__phaserControls = apiRef
    return () => { delete w.__phaserControls }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0" style={{ touchAction: 'none' }} />
  )
}
