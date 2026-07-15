'use client'

interface BoardProps {
  isTie?: boolean
}

const BRIGHT = {
  base: '#080818',
  top: '#0c0c24',
  lineOuter: '#0a3a42',
  lineInner: '#5cd0e0',
  torus: '#0d4550',
} as const

const DIM = {
  base: '#050510',
  top: '#070714',
  lineOuter: '#040f11',
  lineInner: '#1a2c30',
  torus: '#061215',
} as const

export default function Board({ isTie = false }: BoardProps) {
  const gridSize = 3
  const cellSize = 1.2
  const boardSize = gridSize * cellSize
  const lineThickness = 0.06
  const boardY = -0.15
  const c = isTie ? DIM : BRIGHT

  return (
    <group>
      <mesh position={[0, boardY - 0.3, 0]}>
        <cylinderGeometry args={[3.8, 4, 0.3, 24]} />
        <meshBasicMaterial color={c.base} />
      </mesh>

      <mesh position={[0, boardY, 0]}>
        <boxGeometry args={[boardSize + 0.4, 0.1, boardSize + 0.4]} />
        <meshBasicMaterial color={c.top} />
      </mesh>

      {[1, 2].map((i) => (
        <group key={`lines-${i}`}>
          <mesh position={[(i - 1.5) * cellSize, boardY + 0.06, 0]}>
            <boxGeometry args={[lineThickness * 2.5, 0.015, boardSize - 0.2]} />
            <meshBasicMaterial color={c.lineOuter} />
          </mesh>
          <mesh position={[(i - 1.5) * cellSize, boardY + 0.07, 0]}>
            <boxGeometry args={[lineThickness, 0.012, boardSize - 0.2]} />
            <meshBasicMaterial color={c.lineInner} />
          </mesh>
          <mesh position={[0, boardY + 0.06, (i - 1.5) * cellSize]}>
            <boxGeometry args={[boardSize - 0.2, 0.015, lineThickness * 2.5]} />
            <meshBasicMaterial color={c.lineOuter} />
          </mesh>
          <mesh position={[0, boardY + 0.07, (i - 1.5) * cellSize]}>
            <boxGeometry args={[boardSize - 0.2, 0.012, lineThickness]} />
            <meshBasicMaterial color={c.lineInner} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, boardY + 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[boardSize * 0.72, 0.02, 6, 24]} />
        <meshBasicMaterial color={c.torus} />
      </mesh>
    </group>
  )
}
