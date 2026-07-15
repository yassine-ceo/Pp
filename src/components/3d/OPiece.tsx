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

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (highlight) {
      time.current += delta
      const targetY = position[1] + 0.35 + Math.sin(time.current * 2.5) * 0.08
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.08
      groupRef.current.rotation.y += delta * 3
      const s = 1.12 + Math.sin(time.current * 4) * 0.08
      groupRef.current.scale.setScalar(s)
      groupRef.current.children.forEach((child) => {
        if ((child as THREE.Mesh).material && 'emissiveIntensity' in (child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
          mat.emissiveIntensity = 1.2 + Math.sin(time.current * 5) * 0.8
        }
      })
      return
    }

    if (settled.current) return
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
      <pointLight color="#f43f5e" intensity={highlight ? 6 : 2} distance={highlight ? 6 : 3} decay={2} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.06, 12, 24]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={highlight ? 1.5 : 0.8} metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  )
}
