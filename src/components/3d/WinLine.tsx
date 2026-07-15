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
    time.current += delta
    const pulse = 0.7 + Math.sin(time.current * 4) * 0.5
    groupRef.current.children.forEach((child) => {
      if ((child as THREE.Mesh).material && 'emissiveIntensity' in (child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = pulse * (mat.userData.baseIntensity ?? 1)
      }
    })
  })

  if (cells.length < 2) return null

  return (
    <group ref={groupRef} position={[mid.x, mid.y, mid.z]} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.3, 0.04, length + 0.2]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} transparent opacity={0.2} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.18, 0.035, length + 0.1]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.6} transparent opacity={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.08, 0.03, length]} />
        <meshStandardMaterial color="#fde68a" emissive="#facc15" emissiveIntensity={1.5} transparent opacity={0.9} />
      </mesh>
      <pointLight color="#facc15" intensity={4} distance={5} decay={2} />
    </group>
  )
}
