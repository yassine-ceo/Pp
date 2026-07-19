'use client'

import React, { useState, useEffect } from 'react'

const AVATAR_POOL: string[] = [
  'https://image.pollinations.ai/prompt/cyberpunk-anime-boy-glowing-neon-blue-visor-gaming-headset-dark-background-high-quality-anime-art?seed=1&width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/anime-girl-gamer-neon-purple-hair-futuristic-vr-glasses-cyberpunk-aesthetic-digital-art?seed=2&width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/dark-fantasy-anime-mage-glowing-blue-eyes-magic-aura-floating-runes-mysterious-hood?seed=3&width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/chibi-anime-warrior-holding-glowing-pixel-sword-fantasy-rpg-style-vibrant-colors?seed=4&width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/futuristic-anime-boy-with-neon-mask-cyberpunk-city-background-glowing-blue-and-pink-lights?seed=5&width=400&height=600&nologo=true',
]

function CardImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="w-full h-full relative">
      {!loaded && <div className="w-full h-full animate-pulse bg-white/10" />}
      <img
        src={src}
        alt="Avatar"
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-90' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

export default function HeroAnimation() {
  const [activeAvatars, setActiveAvatars] = useState<string[]>(['', '', ''])

  useEffect(() => {
    const shuffled = [...AVATAR_POOL].sort(() => 0.5 - Math.random())
    setActiveAvatars(shuffled.slice(0, 3))
  }, [])

  return (
    <div className="w-full flex items-center justify-center gap-3 sm:gap-5 -translate-y-12 mb-4 relative z-10">

      {/* Gold Card (Left) */}
      <div className="w-[28%] max-w-[110px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.3)] border border-white/20 translate-y-4 overflow-hidden relative">
        {activeAvatars[0] && <CardImage src={activeAvatars[0]} />}
      </div>

      {/* Purple Card (Center/Elevated) */}
      <div className="w-[32%] max-w-[125px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-[0_0_30px_rgba(168,85,247,0.5)] z-10 border border-white/30 -translate-y-4 overflow-hidden relative">
        {activeAvatars[1] && <CardImage src={activeAvatars[1]} />}
      </div>

      {/* Cyan Card (Right) */}
      <div className="w-[28%] max-w-[110px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/20 translate-y-4 overflow-hidden relative">
        {activeAvatars[2] && <CardImage src={activeAvatars[2]} />}
      </div>

    </div>
  )
}
