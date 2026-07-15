'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

function FloatingX({ position, speed }: { position: [number, number, number]; speed: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.z += delta * speed
    ref.current.rotation.y += delta * speed * 0.5
    ref.current.position.y = position[1] + Math.sin(Date.now() * 0.001 * speed) * 0.15
  })
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} transparent opacity={0.7} />
      </mesh>
      <pointLight color="#22d3ee" intensity={1} distance={2} decay={2} />
    </group>
  )
}

function FloatingO({ position, speed }: { position: [number, number, number]; speed: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * speed
    ref.current.rotation.y += delta * speed * 0.7
    ref.current.position.y = position[1] + Math.sin(Date.now() * 0.001 * speed + 1) * 0.15
  })
  return (
    <group position={position}>
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.05, 16, 32]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.6} transparent opacity={0.7} />
      </mesh>
      <pointLight color="#f43f5e" intensity={1} distance={2} decay={2} />
    </group>
  )
}

export default function FloatingDecor() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ background: 'transparent', pointerEvents: 'none' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.2} />
      <FloatingX position={[-1.8, 0.8, -1]} speed={0.5} />
      <FloatingX position={[1.5, -0.6, -2]} speed={0.3} />
      <FloatingX position={[2.2, 1.0, -1.5]} speed={0.7} />
      <FloatingO position={[-1.5, -0.8, -1.5]} speed={0.4} />
      <FloatingO position={[1.8, 0.6, -1]} speed={0.6} />
      <FloatingO position={[-2.2, 0.3, -2]} speed={0.35} />
    </Canvas>
  )
}
