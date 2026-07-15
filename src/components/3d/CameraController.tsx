'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface CameraControllerProps {
  isPlaying: boolean
}

export default function CameraController({ isPlaying }: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  useFrame(() => {
    if (!controlsRef.current) return
    const controls = controlsRef.current
    const targetY = isPlaying ? 0.3 : 0.5
    controls.target.y += (targetY - controls.target.y) * 0.05
    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={2.5}
      maxDistance={6}
      target={[0, 0.3, 0]}
      makeDefault
    />
  )
}
