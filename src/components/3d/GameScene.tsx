'use client'

import { useMemo, useCallback, useState, useEffect, useRef, memo } from 'react'
import { Canvas } from '@react-three/fiber'
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
            onClick={(e) => { e.stopPropagation(); handleClick(i) }}
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

const SceneContent = memo(function SceneContent() {
  const isTie = useGameStore((s) => s.room?.status === 'tie')
  return (
    <>
      <Board isTie={isTie} />
      <ClickPlane />
      <Pieces />
      <WinLineOverlay />
      <CameraController />
    </>
  )
})

const MemoizedCanvas = memo(function MemoizedCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 4.2, 5.0], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      frameloop="always"
    >
      <SceneContent />
    </Canvas>
  )
})

function TieShakeWrapper() {
  const status = useGameStore((s) => s.room?.status)
  const [tieShake, setTieShake] = useState(false)
  const prevStatusRef = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'tie' && prevStatusRef.current === 'playing') {
      setTieShake(true)
      const timer = setTimeout(() => setTieShake(false), 600)
      return () => clearTimeout(timer)
    }
    prevStatusRef.current = status ?? null
  }, [status])

  return (
    <div className={`fixed inset-0 z-0 ${tieShake ? 'animate-board-shake' : ''}`}>
      <MemoizedCanvas />
    </div>
  )
}

export default memo(function GameScene() {
  return <TieShakeWrapper />
})
