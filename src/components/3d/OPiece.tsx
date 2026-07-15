'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OPieceProps {
  position: [number, number, number]
  animate?: boolean
}

export default function OPiece({ position, animate = true }: OPieceProps) {
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
      groupRef.current.rotation.x = (1 - progress) * Math.PI * 0.4
    } else {
      groupRef.current.position.y = position[1]
      groupRef.current.rotation.x = Math.PI / 2
      settled.current = true
    }
  })

  const startPos: [number, number, number] = [position[0], position[1] + (animate ? 1.5 : 0), position[2]]

  return (
    <group ref={groupRef} position={startPos}>
      {/* Neon glow */}
      <pointLight color="#f43f5e" intensity={2} distance={3} decay={2} />

      {/* Main torus */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.25, 0.06, 24, 48]} />
        <meshStandardMaterial
          color="#f43f5e"
          emissive="#f43f5e"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Inner glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.09, 16, 48]} />
        <meshStandardMaterial
          color="#f43f5e"
          emissive="#f43f5e"
          emissiveIntensity={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  )
}
