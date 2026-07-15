'use client'

interface BoardProps {
  isTie?: boolean
}

export default function Board({ isTie = false }: BoardProps) {
  const gridSize = 3
  const cellSize = 1.2
  const boardSize = gridSize * cellSize
  const lineThickness = 0.06
  const boardY = -0.15

  const baseColor = isTie ? '#050510' : '#080818'
  const topColor = isTie ? '#070714' : '#0c0c24'
  const lineCoreColor = isTie ? '#1a2c30' : '#22d3ee'
  const lineGlowColor = isTie ? '#0c1518' : '#0a3a42'
  const torusColor = isTie ? '#0c1518' : '#22d3ee'

  return (
    <group>
      {/* Base cylinder */}
      <mesh position={[0, boardY - 0.3, 0]}>
        <cylinderGeometry args={[3.8, 4, 0.3, 24]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Top platform */}
      <mesh position={[0, boardY, 0]}>
        <boxGeometry args={[boardSize + 0.4, 0.1, boardSize + 0.4]} />
        <meshStandardMaterial color={topColor} roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Grid lines */}
      {[1, 2].map((i) => (
        <group key={`lines-${i}`}>
          {/* Outer glow line (vertical) */}
          <mesh position={[(i - 1.5) * cellSize, boardY + 0.06, 0]}>
            <boxGeometry args={[lineThickness * 2.5, 0.015, boardSize - 0.2]} />
            <meshStandardMaterial color={lineGlowColor} roughness={0.6} metalness={0.2} />
          </mesh>
          {/* Inner core line (vertical) */}
          <mesh position={[(i - 1.5) * cellSize, boardY + 0.07, 0]}>
            <boxGeometry args={[lineThickness, 0.012, boardSize - 0.2]} />
            <meshStandardMaterial color={lineCoreColor} roughness={0.3} metalness={0.6} emissive={lineCoreColor} emissiveIntensity={isTie ? 0.2 : 1.2} />
          </mesh>
          {/* Outer glow line (horizontal) */}
          <mesh position={[0, boardY + 0.06, (i - 1.5) * cellSize]}>
            <boxGeometry args={[boardSize - 0.2, 0.015, lineThickness * 2.5]} />
            <meshStandardMaterial color={lineGlowColor} roughness={0.6} metalness={0.2} />
          </mesh>
          {/* Inner core line (horizontal) */}
          <mesh position={[0, boardY + 0.07, (i - 1.5) * cellSize]}>
            <boxGeometry args={[boardSize - 0.2, 0.012, lineThickness]} />
            <meshStandardMaterial color={lineCoreColor} roughness={0.3} metalness={0.6} emissive={lineCoreColor} emissiveIntensity={isTie ? 0.2 : 1.2} />
          </mesh>
        </group>
      ))}

      {/* Decorative torus ring */}
      <mesh position={[0, boardY + 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[boardSize * 0.72, 0.025, 8, 32]} />
        <meshStandardMaterial color={torusColor} roughness={0.2} metalness={0.8} emissive={torusColor} emissiveIntensity={isTie ? 0.1 : 0.8} />
      </mesh>
    </group>
  )
}
