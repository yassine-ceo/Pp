'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OPieceProps {
  position: [number, number, number]
  animate?: boolean
  highlight?: boolean
}

export default function OPiece({ position, animate = true, highlight = false }: OPieceProps) {
  const groupRef = useRef<THREE.Group>(null)
  const time = useRef(0)
  const settled = useRef(!animate)
  const targetY = useRef(position[1] + (animate ? 1.5 : 0))

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (highlight) {
      time.current += delta
      const ty = position[1] + 0.35 + Math.sin(time.current * 2.5) * 0.08
      groupRef.current.position.y += (ty - groupRef.current.position.y) * 0.15
      groupRef.current.rotation.y += delta * 3
      const s = 1.12 + Math.sin(time.current * 4) * 0.08
      groupRef.current.scale.setScalar(s)
      return
    }

    if (settled.current) return

    const currentY = groupRef.current.position.y
    const finalY = position[1]

    if (Math.abs(currentY - finalY) < 0.005) {
      groupRef.current.position.y = finalY
      groupRef.current.rotation.x = Math.PI / 2
      settled.current = true
      return
    }

    targetY.current += (finalY - targetY.current) * 0.12
    groupRef.current.position.y += (targetY.current - currentY) * 0.18
    groupRef.current.rotation.x += (Math.PI / 2 - groupRef.current.rotation.x) * 0.1
  })

  const startPos: [number, number, number] = [position[0], position[1] + (animate ? 1.5 : 0), position[2]]

  return (
    <group ref={groupRef} position={startPos}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.06, 6, 12]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>
    </group>
  )
}
