'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface XPieceProps {
  position: [number, number, number]
  animate?: boolean
  highlight?: boolean
}

export default function XPiece({ position, animate = true, highlight = false }: XPieceProps) {
  const groupRef = useRef<THREE.Group>(null)
  const time = useRef(0)
  const settled = useRef(!animate)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const dt = Math.min(delta, 0.05)

    if (highlight) {
      time.current += dt
      const ty = position[1] + 0.35 + Math.sin(time.current * 2.5) * 0.08
      groupRef.current.position.y += (ty - groupRef.current.position.y) * (1 - Math.exp(-8 * dt))
      groupRef.current.rotation.y += dt * 3
      const s = 1.12 + Math.sin(time.current * 4) * 0.08
      groupRef.current.scale.setScalar(s)
      return
    }

    if (settled.current) return

    const currentY = groupRef.current.position.y
    const finalY = position[1]

    if (Math.abs(currentY - finalY) < 0.005) {
      groupRef.current.position.y = finalY
      groupRef.current.rotation.x = 0
      groupRef.current.rotation.z = 0
      settled.current = true
      return
    }

    const dropFactor = 1 - Math.exp(-7 * dt)
    const rotFactor = 1 - Math.exp(-12 * dt)
    groupRef.current.position.y += (finalY - currentY) * dropFactor
    groupRef.current.rotation.x *= Math.pow(0.1, dt)
    groupRef.current.rotation.z *= Math.pow(0.1, dt)
  })

  const startPos: [number, number, number] = [position[0], position[1] + (animate ? 1.5 : 0), position[2]]

  return (
    <group ref={groupRef} position={startPos}>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.09, 0.65, 0.09]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.09, 0.65, 0.09]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
    </group>
  )
}
