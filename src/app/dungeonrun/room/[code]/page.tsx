'use client'

import { useParams, useRouter } from 'next/navigation'
import DungeonRun from '@/game/DungeonRun'

export default function DungeonRunRoomPage() {
  const router = useRouter()

  return <DungeonRun onBack={() => router.push('/')} />
}
