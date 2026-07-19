'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function HeroAnimation() {
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    fetch('https://lottie.host/809c91b4-b3cc-49a3-a7c3-305f242551e1/X1x8hK1gW0.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Error loading Lottie animation:', err))
  }, [])

  if (!animationData) {
    return (
      <div className="h-48 w-full flex items-center justify-center text-sky-400/50 text-sm animate-pulse font-bold tracking-widest">
        CONNECTING...
      </div>
    )
  }

  return (
    <div className="w-full max-w-[280px] mx-auto h-auto flex items-center justify-center pointer-events-none drop-shadow-2xl">
      <Lottie animationData={animationData} loop={true} />
    </div>
  )
}
