'use client'

import { MeshReflectorMaterial, MeshTransmissionMaterial, Grid } from '@react-three/drei'

interface BoardProps {
  isTie?: boolean
}

export default function Board({ isTie = false }: BoardProps) {
  const gridSize = 3
  const cellSize = 1.2
  const boardSize = gridSize * cellSize

  const gridColor = isTie ? '#3a4a4e' : '#b0e0e8'
  const gridEmissive = isTie ? '#1a2c30' : '#22d3ee'
  const emissivePower = isTie ? 0.3 : 2.5

  return (
    <group>
      {/* === REFLECTIVE DESK FLOOR === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={[400, 400]}
          resolution={1024}
          mixBlur={1}
          mixStrength={15}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#151515"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Subtle floor grid from drei */}
      <Grid
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1a1a2a"
        sectionSize={2}
        sectionThickness={0.8}
        sectionColor="#222240"
        fadeDistance={18}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid
        position={[0, -0.499, 0]}
      />

      {/* === CRYSTAL BOARD BASE === */}
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[boardSize + 0.6, 0.4, boardSize + 0.6]} />
        <MeshTransmissionMaterial
          thickness={0.6}
          roughness={0.05}
          transmission={1}
          ior={1.5}
          chromaticAberration={0.04}
          backside={true}
        />
      </mesh>

      {/* Chrome edge trim */}
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <boxGeometry args={[boardSize + 0.65, 0.02, boardSize + 0.65]} />
        <meshPhysicalMaterial
          color="#d0d0d0"
          roughness={0.05}
          metalness={0.95}
          clearcoat={1}
          clearcoatRoughness={0.02}
        />
      </mesh>

      {/* === GRID RODS (etched into crystal) === */}
      {[1, 2].map((i) => (
        <group key={`lines-${i}`}>
          <mesh position={[(i - 1.5) * cellSize, -0.08, 0]} castShadow>
            <boxGeometry args={[0.09, 0.025, boardSize - 0.3]} />
            <meshPhysicalMaterial
              color={gridColor}
              roughness={0.1}
              metalness={0.9}
              emissive={gridEmissive}
              emissiveIntensity={emissivePower}
              clearcoat={1}
              clearcoatRoughness={0.05}
            />
          </mesh>
          <mesh position={[0, -0.08, (i - 1.5) * cellSize]} castShadow>
            <boxGeometry args={[boardSize - 0.3, 0.025, 0.09]} />
            <meshPhysicalMaterial
              color={gridColor}
              roughness={0.1}
              metalness={0.9}
              emissive={gridEmissive}
              emissiveIntensity={emissivePower}
              clearcoat={1}
              clearcoatRoughness={0.05}
            />
          </mesh>
        </group>
      ))}

      {/* === CHROME TORUS RING === */}
      <mesh position={[0, -0.075, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[boardSize * 0.72, 0.03, 16, 64]} />
        <meshPhysicalMaterial
          color={isTie ? '#4a5a5e' : '#e8e8e8'}
          roughness={0.05}
          metalness={0.95}
          emissive={gridEmissive}
          emissiveIntensity={emissivePower * 0.3}
          clearcoat={1}
          clearcoatRoughness={0.02}
        />
      </mesh>
    </group>
  )
}
