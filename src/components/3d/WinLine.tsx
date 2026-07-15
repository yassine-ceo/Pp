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

  const { mid, length, rotation } = useMemo(() => {
    if (cells.length < 2) return { mid: new THREE.Vector3(), length: 0, rotation: 0 }
    const a = cellToWorld(cells[0])
    const b = cellToWorld(cells[cells.length - 1])
    const m = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    const l = a.distanceTo(b) + CELL_SIZE * 0.6
    const angle = Math.atan2(b.x - a.x, b.z - a.z)
    return { mid: m, length: l, rotation: angle }
  }, [cells])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    time.current += Math.min(delta, 0.05)
    const scale = 0.85 + Math.sin(time.current * 3) * 0.15
    groupRef.current.scale.set(1, 1, scale)
  })

  if (cells.length < 2) return null

  return (
    <group ref={groupRef} position={[mid.x, mid.y, mid.z]} rotation={[0, rotation, 0]}>
      {/* Outer glow */}
      <mesh>
        <boxGeometry args={[0.3, 0.04, length + 0.2]} />
        <meshStandardMaterial color="#9a7e0c" roughness={0.5} metalness={0.4} emissive="#facc15" emissiveIntensity={0.3} />
      </mesh>
      {/* Middle layer */}
      <mesh>
        <boxGeometry args={[0.18, 0.035, length + 0.1]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.6} emissive="#facc15" emissiveIntensity={0.8} />
      </mesh>
      {/* Bright core */}
      <mesh>
        <boxGeometry args={[0.08, 0.03, length]} />
        <meshStandardMaterial color="#fde68a" roughness={0.2} metalness={0.7} emissive="#fde68a" emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}
