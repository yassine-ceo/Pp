'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface Props {
  count?: number
}

const COLORS_X = ['#00e5ff', '#22d3ee', '#67e8f9']
const COLORS_O = ['#fb7185', '#f43f5e', '#e11d48']

interface DecorPiece {
  id: string
  x: number
  y: number
  z: number
  scale: number
  rotationX: number
  rotationY: number
  rotationZ: number
  type: 'X' | 'O'
  color: string
  delay: number
}

export default function FloatingDecor({ count = 6 }: Props) {
  const pieces = useMemo<DecorPiece[]>(() => {
    const arr: DecorPiece[] = []
    for (let i = 0; i < count; i++) {
      const isX = i < Math.ceil(count / 2)
      const type: 'X' | 'O' = isX ? 'X' : 'O'
      const colors = isX ? COLORS_X : COLORS_O
      arr.push({
        id: `${type}-${i}`,
        x: Math.random() * 100 - 50,
        y: Math.random() * 60 - 30,
        z: -30 - Math.random() * 20,
        scale: 0.4 + Math.random() * 0.5,
        rotationX: Math.random() * 360,
        rotationY: Math.random() * 360,
        rotationZ: Math.random() * 360,
        type,
        color: colors[i % colors.length],
        delay: Math.random() * 2,
      })
    }
    return arr
  }, [count])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${50 + p.x * 0.8}%`,
            top: `${50 + p.y * 0.8}%`,
            width: p.type === 'X' ? 48 * p.scale : 44 * p.scale,
            height: p.type === 'X' ? 48 * p.scale : 44 * p.scale,
            transform: `translate(-50%, -50%) rotateX(${p.rotationX}deg) rotateY(${p.rotationY}deg) rotateZ(${p.rotationZ}deg)`,
            opacity: 0.15,
          }}
          animate={{
            y: [0, -15, 0, 10, 0],
            rotateZ: [p.rotationZ, p.rotationZ + 15, p.rotationZ - 10, p.rotationZ],
            opacity: [0.1, 0.2, 0.1, 0.18, 0.1],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        >
          {p.type === 'X' ? (
            <svg viewBox="0 0 48 48" fill="none">
              <line x1="8" y1="8" x2="40" y2="40" stroke={p.color} strokeWidth="4" strokeLinecap="round" />
              <line x1="40" y1="8" x2="8" y2="40" stroke={p.color} strokeWidth="4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="16" stroke={p.color} strokeWidth="4" />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  )
}
