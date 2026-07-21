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
  const sceneReadyRef = useRef(false)
  const pendingRemoteState = useRef<{
    x: number; y: number; facing: number; hp: number; name: string;
    lastShootTime: number; shootFacing: number; remoteId: string;
  } | null>(null)

  const syncState = useCallback((data: Record<string, any>) => {
    if (cleanupRef.current) return
    updatePlayerPosition(roomCode, playerId, {
      x: Math.round(data.x),
      y: Math.round(data.y),
      vx: Math.round(data.vx),
      vy: Math.round(data.vy),
      grounded: data.grounded,
      facing: data.facing,
      hp: data.hp ?? 100,
      lastShootTime: data.lastShootTime ?? 0,
      shootFacing: data.shootFacing ?? 1,
    }).catch(() => {})
  }, [roomCode, playerId])

  const applyRemoteState = useCallback(() => {
    const s = pendingRemoteState.current
    if (!s) return
    if (currentSceneRef.current === 'lobby' && lobbyRef.current) {
      lobbyRef.current.setRemotePosition(s.x, s.y, s.facing)
    } else if (currentSceneRef.current === 'level1' && level1Ref.current) {
      level1Ref.current.setRemotePosition(
        s.x, s.y, s.facing,
        s.hp, s.name,
        s.lastShootTime, s.shootFacing, s.remoteId,
      )
    }
  }, [])

  const doTransition = useCallback(() => {
    if (cleanupRef.current || currentSceneRef.current === 'level1') return
    currentSceneRef.current = 'level1'
    sceneReadyRef.current = false
    onLevelStart()
    const game = gameRef.current
    if (!game) return
    game.scene.stop('LobbyScene')
    game.scene.start('Level1Scene', { roomCode })
    const l1 = game.scene.getScene('Level1Scene') as Level1Scene
    level1Ref.current = l1
    l1.setCallbacks(syncState)
  }, [onLevelStart, syncState, roomCode])

  // Subscribe to Firebase room
  useEffect(() => {
    cleanupRef.current = false
    let hostHasTriggered = false

    const unsub = subscribePlatformerRoom(roomCode, (room: PlatformerRoom | null) => {
      if (cleanupRef.current || !room) return

      const otherPlayers = Object.entries(room.players).filter(([id]) => id !== playerId)
      const remoteCount = otherPlayers.length

      if (remoteCount > 0) {
        onRemoteJoin()

        const [remoteId, remoteState] = otherPlayers[0]
        const state = {
          x: remoteState.x, y: remoteState.y, facing: remoteState.facing,
          hp: remoteState.hp ?? 100, name: remoteState.name ?? '',
          lastShootTime: remoteState.lastShootTime ?? 0,
          shootFacing: remoteState.shootFacing ?? remoteState.facing,
          remoteId,
        }
        pendingRemoteState.current = state

        // Only apply if scene is ready
        if (sceneReadyRef.current) {
          if (currentSceneRef.current === 'lobby' && lobbyRef.current) {
            lobbyRef.current.setRemotePosition(state.x, state.y, state.facing)
          } else if (currentSceneRef.current === 'level1' && level1Ref.current) {
            level1Ref.current.setRemotePosition(
              state.x, state.y, state.facing,
              state.hp, state.name,
              state.lastShootTime, state.shootFacing, state.remoteId,
            )
          }
        }

        if (isHost && room.status === 'waiting' && remoteCount >= 1 && !hostHasTriggered) {
          hostHasTriggered = true
          setRoomStatus(roomCode, 'starting').catch(() => {})
        }
      } else {
        pendingRemoteState.current = null
        if (sceneReadyRef.current) {
          if (currentSceneRef.current === 'lobby' && lobbyRef.current) {
            lobbyRef.current.setRemoteDisconnected()
          } else if (currentSceneRef.current === 'level1' && level1Ref.current) {
            level1Ref.current.setRemoteDisconnected()
          }
        }
      }

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

    // Listen for scene-ready events from scenes
    const onSceneReady = (sceneKey: string) => {
      if (sceneKey === 'LobbyScene') {
        const lobby = game.scene.getScene('LobbyScene') as LobbyScene
        lobbyRef.current = lobby
        lobby.setCallbacks(syncState)
        sceneReadyRef.current = true
        applyRemoteState()
      } else if (sceneKey === 'Level1Scene') {
        const l1 = game.scene.getScene('Level1Scene') as Level1Scene
        level1Ref.current = l1
        sceneReadyRef.current = true
        applyRemoteState()
      }
    }
    game.events.on('scene-ready', onSceneReady)

    game.events.on('ready', () => {
      game.scene.start('LobbyScene', { roomCode, playerId, playerName, isHost })
    })

    return () => {
      cleanupRef.current = true
      game.events.off('scene-ready', onSceneReady)
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
  }, [roomCode, playerId, playerName, isHost, syncState, applyRemoteState])

  // Expose control methods via window for TouchControls
  const setLobbyControls = useCallback((controls: { left: boolean; right: boolean; jump: boolean }) => {
    lobbyRef.current?.setActiveControls(controls)
  }, [])

  const setLevelControls = useCallback((controls: { left: boolean; right: boolean; jump: boolean }) => {
    level1Ref.current?.setActiveControls(controls)
  }, [])

  const fireShoot = useCallback(() => {
    if (currentSceneRef.current === 'level1' && level1Ref.current) {
      level1Ref.current.fireBullet()
    }
  }, [])

  const apiRef = useRef({ setLobbyControls, setLevelControls, currentSceneRef, fireShoot })
  apiRef.current = { setLobbyControls, setLevelControls, currentSceneRef, fireShoot }

  useEffect(() => {
    const w = window as any
    w.__phaserControls = apiRef
    return () => { delete w.__phaserControls }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0" style={{ touchAction: 'none' }} />
  )
}
