'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function HeroAnimation() {
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    // TIP: To get the "Boy and Girl Playing" animation:
    // 1. Go to lottiefiles.com
    // 2. Search for "gaming" or "online friends"
    // 3. Click the animation > Click "Lottie JSON" > Copy the URL
    // 4. Paste that URL below:
    const LOTTIE_URL = 'https://lottie.host/809c91b4-b3cc-49a3-a7c3-305f242551e1/X1x8hK1gW0.json'

    fetch(LOTTIE_URL)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Error loading Lottie:', err))
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
