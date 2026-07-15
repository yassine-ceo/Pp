'use client'

interface BoardProps {
  isTie?: boolean
}

export default function Board({ isTie = false }: BoardProps) {
  const gridSize = 3
  const cellSize = 1.2
  const boardSize = gridSize * cellSize
  const lineThickness = 0.08

  const gridColor = isTie ? '#2a3a3e' : '#b0e0e8'
  const gridEmissive = isTie ? '#1a2c30' : '#22d3ee'
  const emissivePower = isTie ? 0.3 : 2.0

  return (
    <group>
      {/* === DESK / FLOOR === */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <boxGeometry args={[20, 1, 20]} />
        <meshPhysicalMaterial
          color="#1a1008"
          roughness={0.15}
          metalness={0.1}
          clearcoat={0.5}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* === BOARD BASE === */}
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[boardSize + 0.6, 0.4, boardSize + 0.6]} />
        <meshPhysicalMaterial
          color="#e8e4e0"
          roughness={0.1}
          metalness={0.4}
          transmission={0.15}
          thickness={0.5}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Board edge trim */}
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <boxGeometry args={[boardSize + 0.65, 0.02, boardSize + 0.65]} />
        <meshPhysicalMaterial
          color="#c0c0c0"
          roughness={0.05}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* === GRID LINES (Physical metallic rods) === */}
      {[1, 2].map((i) => (
        <group key={`lines-${i}`}>
          {/* Vertical rod */}
          <mesh position={[(i - 1.5) * cellSize, -0.075, 0]} castShadow>
            <boxGeometry args={[lineThickness, 0.03, boardSize - 0.3]} />
            <meshPhysicalMaterial
              color={gridColor}
              roughness={0.1}
              metalness={0.85}
              emissive={gridEmissive}
              emissiveIntensity={emissivePower}
              clearcoat={1}
              clearcoatRoughness={0.05}
            />
          </mesh>
          {/* Horizontal rod */}
          <mesh position={[0, -0.075, (i - 1.5) * cellSize]} castShadow>
            <boxGeometry args={[boardSize - 0.3, 0.03, lineThickness]} />
            <meshPhysicalMaterial
              color={gridColor}
              roughness={0.1}
              metalness={0.85}
              emissive={gridEmissive}
              emissiveIntensity={emissivePower}
              clearcoat={1}
              clearcoatRoughness={0.05}
            />
          </mesh>
        </group>
      ))}

      {/* === DECORATIVE TORUS RING === */}
      <mesh position={[0, -0.07, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[boardSize * 0.72, 0.03, 12, 48]} />
        <meshPhysicalMaterial
          color={isTie ? '#3a4a4e' : '#e0e0e0'}
          roughness={0.05}
          metalness={0.95}
          emissive={gridEmissive}
          emissiveIntensity={emissivePower * 0.4}
          clearcoat={1}
          clearcoatRoughness={0.02}
        />
      </mesh>
    </group>
  )
}
