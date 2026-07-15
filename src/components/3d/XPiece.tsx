'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DROP_DURATION = 0.5

interface XPieceProps {
  position: [number, number, number]
  animate?: boolean
  highlight?: boolean
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const u = t - 1.5 / 2.75; return 7.5625 * u * u + 0.75 }
  if (t < 2.5 / 2.75) { const u = t - 2.25 / 2.75; return 7.5625 * u * u + 0.9375 }
  const u = t - 2.625 / 2.75
  return 7.5625 * u * u + 0.984375
}

export default function XPiece({ position, animate = true, highlight = false }: XPieceProps) {
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
    const eased = easeOutBounce(progress)

    groupRef.current.position.y = startY + (position[1] - startY) * eased
    groupRef.current.rotation.x = (1 - eased) * Math.PI * 0.3
    groupRef.current.rotation.z = (1 - eased) * Math.PI * 0.2

    if (progress >= 1) {
      groupRef.current.position.y = position[1]
      groupRef.current.rotation.x = 0
      groupRef.current.rotation.z = 0
      done.current = true
    }
  })

  return (
    <group ref={groupRef} position={[position[0], startY, position[2]]}>
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
