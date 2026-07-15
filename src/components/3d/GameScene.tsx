'use client'

import { useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import Board from './Board'
import XPiece from './XPiece'
import OPiece from './OPiece'
import WinLine from './WinLine'
import CameraController from './CameraController'
import { useGameStore } from '@/stores/gameStore'
import { makeMove } from '@/lib/firebase'
import { soundManager } from '@/lib/sound'

const cellSize = 1.2

function getCellPosition(index: number): [number, number, number] {
  const row = Math.floor(index / 3)
  const col = index % 3
  const x = (col - 1) * cellSize
  const z = (row - 1) * cellSize
  return [x, 0.07, z]
}

function ClickPlane() {
  const { roomId, room, playerId, localBoard, applyOptimisticMove } = useGameStore()

  const handleClick = useCallback((index: number) => {
    if (!roomId || !room || !playerId) return
    if (room.status !== 'playing') return
    if (room.turn !== playerId) return
    if (localBoard[index] !== '') return

    const symbol = room?.players?.p1?.id === playerId ? 'X' : 'O'

    applyOptimisticMove(index, symbol)

    if (symbol === 'X') soundManager.playPlaceX()
    else soundManager.playPlaceO()

    makeMove(roomId, playerId, index, room.board, room.turn)
  }, [roomId, room, playerId, localBoard, applyOptimisticMove])

  return (
    <group position={[0, -0.08, 0]}>
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const x = (col - 1) * cellSize
        const z = (row - 1) * cellSize
        return (
          <mesh
            key={i}
            position={[x, 0, z]}
            onClick={(e) => {
              e.stopPropagation()
              handleClick(i)
            }}
            onPointerOver={() => { document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = 'default' }}
          >
            <boxGeometry args={[cellSize * 0.95, 0.01, cellSize * 0.95]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )
      })}
    </group>
  )
}

function Pieces() {
  const localBoard = useGameStore((s) => s.localBoard)
  const winHighlightCells = useGameStore((s) => s.winHighlightCells)

  const pieces = useMemo(() => {
    return localBoard.map((cell, i) => ({
      cell,
      index: i,
      position: getCellPosition(i),
    })).filter((p) => p.cell !== '')
  }, [localBoard])

  const winSet = useMemo(() => new Set(winHighlightCells), [winHighlightCells])

  return (
    <group>
      {pieces.map(({ cell, index, position }) =>
        cell === 'X'
          ? <XPiece key={`x-${index}`} position={position} highlight={winSet.has(index)} />
          : <OPiece key={`o-${index}`} position={position} highlight={winSet.has(index)} />
      )}
    </group>
  )
}

function WinLineOverlay() {
  const winHighlightCells = useGameStore((s) => s.winHighlightCells)
  if (winHighlightCells.length < 2) return null
  return <WinLine cells={winHighlightCells} />
}

interface GameSceneProps {
  isPlaying: boolean
}

export default function GameScene({ isPlaying }: GameSceneProps) {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        shadows
        camera={{ position: [0, 3.8, 5.5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <spotLight
          position={[0, 6, 0]}
          intensity={0.8}
          angle={0.5}
          penumbra={0.5}
          castShadow
        />

        <Board />
        <ClickPlane />
        <Pieces />
        <WinLineOverlay />
        <CameraController isPlaying={isPlaying} />

        <Environment preset="night" />
        <fog attach="fog" args={['#0a0a1a', 5, 15]} />
      </Canvas>
    </div>
  )
}
