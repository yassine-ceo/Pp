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
  const dim = isTie ? 0.2 : 1

  return (
    <group>
      <mesh position={[0, boardY - 0.3, 0]}>
        <cylinderGeometry args={[3.8, 4, 0.3, 24]} />
        <meshBasicMaterial color="#080818" transparent opacity={dim} />
      </mesh>

      <mesh position={[0, boardY, 0]}>
        <boxGeometry args={[boardSize + 0.4, 0.1, boardSize + 0.4]} />
        <meshBasicMaterial color="#0c0c24" transparent opacity={0.95 * dim} />
      </mesh>

      {[1, 2].map((i) => (
        <group key={`lines-${i}`}>
          <mesh position={[(i - 1.5) * cellSize, boardY + 0.06, 0]}>
            <boxGeometry args={[lineThickness * 2.5, 0.015, boardSize - 0.2]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.25 * dim} />
          </mesh>
          <mesh position={[(i - 1.5) * cellSize, boardY + 0.07, 0]}>
            <boxGeometry args={[lineThickness, 0.012, boardSize - 0.2]} />
            <meshBasicMaterial color="#67e8f9" transparent opacity={0.9 * dim} />
          </mesh>
          <mesh position={[0, boardY + 0.06, (i - 1.5) * cellSize]}>
            <boxGeometry args={[boardSize - 0.2, 0.015, lineThickness * 2.5]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.25 * dim} />
          </mesh>
          <mesh position={[0, boardY + 0.07, (i - 1.5) * cellSize]}>
            <boxGeometry args={[boardSize - 0.2, 0.012, lineThickness]} />
            <meshBasicMaterial color="#67e8f9" transparent opacity={0.9 * dim} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, boardY + 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[boardSize * 0.72, 0.02, 6, 24]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.3 * dim} />
      </mesh>
    </group>
  )
}
