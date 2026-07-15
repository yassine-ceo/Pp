'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'

const DEFAULT_POS = new THREE.Vector3(0, 3.8, 5.5)
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0)

interface CameraControllerProps {
  isPlaying: boolean
}

export default function CameraController({ isPlaying }: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const isResetting = useRef(false)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const { gl } = useThree()

  const handlePointerUp = useCallback(() => {
    isResetting.current = true
  }, [])

  useEffect(() => {
    const dom = gl.domElement
    dom.addEventListener('pointerup', handlePointerUp)
    dom.addEventListener('touchend', handlePointerUp)
    return () => {
      dom.removeEventListener('pointerup', handlePointerUp)
      dom.removeEventListener('touchend', handlePointerUp)
    }
  }, [gl, handlePointerUp])

  useFrame((state) => {
    if (!controlsRef.current) return
    const controls = controlsRef.current

    if (!cameraRef.current) {
      cameraRef.current = state.camera as THREE.PerspectiveCamera
    }

    if (isResetting.current && cameraRef.current) {
      const cam = cameraRef.current
      const t = controls.target

      cam.position.lerp(DEFAULT_POS, 0.06)
      t.lerp(DEFAULT_TARGET, 0.06)

      if (cam.position.distanceTo(DEFAULT_POS) < 0.05) {
        cam.position.copy(DEFAULT_POS)
        t.copy(DEFAULT_TARGET)
        isResetting.current = false
      }
    } else {
      const targetY = isPlaying ? 0 : 0
      controls.target.y += (targetY - controls.target.y) * 0.05
    }

    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={3}
      maxDistance={12}
      target={[0, 0, 0]}
      makeDefault
    />
  )
}
