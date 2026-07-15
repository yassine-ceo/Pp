'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CELL_SIZE = 1.2

interface WinLineProps {
  cells: number[]
}

function cellToWorld(index: number): THREE.Vector3 {
  const row = Math.floor(index / 3)
  const col = index % 3
  const x = (col - 1) * CELL_SIZE
  const z = (row - 1) * CELL_SIZE
  return new THREE.Vector3(x, 0.18, z)
}

export default function WinLine({ cells }: WinLineProps) {
  const groupRef = useRef<THREE.Group>(null)
  const time = useRef(0)

  const { start, end, mid, length, rotation } = useMemo(() => {
    if (cells.length < 2) return { start: new THREE.Vector3(), end: new THREE.Vector3(), mid: new THREE.Vector3(), length: 0, rotation: 0 }
    const a = cellToWorld(cells[0])
    const b = cellToWorld(cells[cells.length - 1])
    const m = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    const l = a.distanceTo(b) + CELL_SIZE * 0.6
    const angle = Math.atan2(b.x - a.x, b.z - a.z)
    return { start: a, end: b, mid: m, length: l, rotation: angle }
  }, [cells])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    time.current += delta
    // Pulsing glow
    const pulse = 0.8 + Math.sin(time.current * 4) * 0.4
    groupRef.current.children.forEach((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = pulse
        mat.opacity = 0.6 + pulse * 0.3
      }
    })
  })

  if (cells.length < 2) return null

  return (
    <group ref={groupRef} position={[mid.x, mid.y, mid.z]} rotation={[0, rotation, 0]}>
      {/* Main neon line */}
      <mesh>
        <boxGeometry args={[0.1, 0.03, length]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#facc15"
          emissiveIntensity={1}
          transparent
          opacity={0.85}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>
      {/* Outer glow */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.25, 0.04, length + 0.1]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#facc15"
          emissiveIntensity={0.4}
          transparent
          opacity={0.25}
        />
      </mesh>
      {/* Point light along line */}
      <pointLight color="#facc15" intensity={3} distance={4} decay={2} />
    </group>
  )
}
