'use client'

import dynamic from 'next/dynamic'

const DungeonRun = dynamic(() => import('@/game/DungeonRun'), { ssr: false })

export default function DungeonRunRoomPage() {
  return <DungeonRun />
}
