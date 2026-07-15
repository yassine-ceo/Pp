'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

const DESKTOP_POS = new THREE.Vector3(0, 4.2, 5.0)
const MOBILE_POS = new THREE.Vector3(0, 5.0, 6.2)
const LOOK_AT = new THREE.Vector3(0, 0, 0)

export default function CameraController() {
  const { camera, size } = useThree()

  useEffect(() => {
    const isMobile = size.width < 768
    const target = isMobile ? MOBILE_POS : DESKTOP_POS
    camera.position.copy(target)
    camera.lookAt(LOOK_AT)
    camera.updateProjectionMatrix()
  }, [camera, size.width])

  return null
}
