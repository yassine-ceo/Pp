'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface XPieceProps {
  position: [number, number, number]
  animate?: boolean
}

export default function XPiece({ position, animate = true }: XPieceProps) {
  const groupRef = useRef<THREE.Group>(null)
  const time = useRef(0)
  const settled = useRef(!animate)

  useFrame((_, delta) => {
    if (!groupRef.current || settled.current) return
    time.current += delta
    const t = time.current
    if (t < 0.4) {
      const progress = t / 0.4
      const bounce = progress < 0.7
        ? 1 - Math.pow(1 - progress / 0.7, 3) * 1.5
        : 1 + Math.sin((progress - 0.7) / 0.3 * Math.PI) * 0.08
      groupRef.current.position.y = position[1] + (1 - bounce) * 1.5
      groupRef.current.rotation.x = (1 - progress) * Math.PI * 0.3
      groupRef.current.rotation.z = (1 - progress) * Math.PI * 0.2
    } else {
      groupRef.current.position.y = position[1]
      groupRef.current.rotation.x = 0
      groupRef.current.rotation.z = 0
      settled.current = true
    }
  })

  const startPos: [number, number, number] = [position[0], position[1] + (animate ? 1.5 : 0), position[2]]

  return (
    <group ref={groupRef} position={startPos}>
      {/* Neon glow point light */}
      <pointLight color="#22d3ee" intensity={2} distance={3} decay={2} />

      {/* Bar 1 */}
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.08, 0.65, 0.08]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Bar 2 */}
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <boxGeometry args={[0.08, 0.65, 0.08]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  )
}
