'use client'

import { useRef, useMemo } from 'react'
import * as THREE from 'three'

export default function Board() {
  const meshRef = useRef<THREE.Mesh>(null)

  const woodTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const baseColor = [62, 39, 22]
    ctx.fillStyle = `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`
    ctx.fillRect(0, 0, 512, 512)
    for (let y = 0; y < 512; y += 2) {
      const offset = Math.sin(y * 0.02) * 8
      const brightness = Math.sin(y * 0.08 + offset) * 12
      const r = Math.max(0, Math.min(255, baseColor[0] + brightness + (Math.random() * 6 - 3)))
      const g = Math.max(0, Math.min(255, baseColor[1] + brightness * 0.7 + (Math.random() * 4 - 2)))
      const b = Math.max(0, Math.min(255, baseColor[2] + brightness * 0.4 + (Math.random() * 4 - 2)))
      ctx.fillStyle = `rgb(${r|0}, ${g|0}, ${b|0})`
      ctx.fillRect(0, y, 512, 2)
    }
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const w = Math.random() * 3 + 1
      const h = Math.random() * 40 + 10
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`
      ctx.fillRect(x, y, w, h)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [])

  const gridSize = 3
  const cellSize = 1.2
  const boardSize = gridSize * cellSize
  const lineThickness = 0.04
  const boardY = -0.15

  return (
    <group>
      {/* Table surface */}
      <mesh position={[0, boardY - 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[4, 4.2, 0.3, 64]} />
        <meshStandardMaterial color="#1a0f08" roughness={0.9} />
      </mesh>

      {/* Board base */}
      <mesh ref={meshRef} position={[0, boardY, 0]} receiveShadow castShadow>
        <boxGeometry args={[boardSize + 0.3, 0.12, boardSize + 0.3]} />
        <meshStandardMaterial
          map={woodTexture}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Grid lines */}
      {[1, 2].map((i) => (
        <group key={`lines-${i}`}>
          <mesh position={[(i - 1.5) * cellSize, boardY + 0.07, 0]} castShadow>
            <boxGeometry args={[lineThickness, 0.02, boardSize - 0.1]} />
            <meshStandardMaterial color="#c9a96e" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0, boardY + 0.07, (i - 1.5) * cellSize]} castShadow>
            <boxGeometry args={[boardSize - 0.1, 0.02, lineThickness]} />
            <meshStandardMaterial color="#c9a96e" metalness={0.4} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Clickable cells */}
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const x = (col - 1) * cellSize
        const z = (row - 1) * cellSize
        return (
          <mesh
            key={i}
            position={[x, boardY + 0.01, z]}
            visible={false}
          >
            <boxGeometry args={[cellSize * 0.9, 0.01, cellSize * 0.9]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )
      })}
    </group>
  )
}

export { }
