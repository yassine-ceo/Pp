'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DROP_DURATION = 0.5

interface OPieceProps {
  position: [number, number, number]
  animate?: boolean
  highlight?: boolean
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export default function OPiece({ position, animate = true, highlight = false }: OPieceProps) {
  const groupRef = useRef<THREE.Group>(null)
  const elapsed = useRef(0)
  const done = useRef(!animate)
  const startY = position[1] + (animate ? 1.5 : 0)

  useFrame((_, delta) => {
    if (!groupRef.current || done.current) return
    const dt = Math.min(delta, 0.1)

    if (highlight) {
      elapsed.current += dt
      const ty = position[1] + 0.35 + Math.sin(elapsed.current * 2.5) * 0.08
      groupRef.current.position.y += (ty - groupRef.current.position.y) * (1 - Math.exp(-8 * dt))
      groupRef.current.rotation.y += dt * 3
      const s = 1.12 + Math.sin(elapsed.current * 4) * 0.08
      groupRef.current.scale.setScalar(s)
      return
    }

    elapsed.current += dt
    const progress = Math.min(elapsed.current / DROP_DURATION, 1)
    const eased = easeOutBack(progress)

    groupRef.current.position.y = startY + (position[1] - startY) * eased
    groupRef.current.rotation.x = eased * Math.PI / 2

    if (progress >= 1) {
      groupRef.current.position.y = position[1]
      groupRef.current.rotation.x = Math.PI / 2
      done.current = true
    }
  })

  const emissiveBoost = highlight ? 1.5 : 0.6

  return (
    <group ref={groupRef} position={[position[0], startY, position[2]]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.065, 12, 24]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.2} metalness={0.8} emissive="#f43f5e" emissiveIntensity={emissiveBoost} />
      </mesh>
    </group>
  )
}
