'use client'

import React, { useState, useEffect } from 'react'

const AVATAR_POOL: string[] = [
  // Style 1: Dark Fantasy
  'https://image.pollinations.ai/prompt/dark-fantasy-mysterious-character-with-glowing-neon-blue-magical-fire-above-head-dark-cloak-glowing-white-eyes-purple-background?width=400&height=600&nologo=true&seed=101',
  'https://image.pollinations.ai/prompt/shadow-assassin-female-character-glowing-blue-magical-flames-dark-hooded-cloak-striking-glowing-eyes-fantasy-avatar?width=400&height=600&nologo=true&seed=102',
  'https://image.pollinations.ai/prompt/mystical-dark-fantasy-warlock-neon-blue-fire-crown-wrapped-in-dark-bandages-glowing-core-dark-violet-fog?width=400&height=600&nologo=true&seed=103',
  'https://image.pollinations.ai/prompt/enigmatic-dark-sorceress-glowing-bright-blue-magical-aura-hooded-dark-robes-piercing-glowing-eyes-neon-purple?width=400&height=600&nologo=true&seed=104',
  'https://image.pollinations.ai/prompt/dark-mythical-creature-avatar-glowing-blue-flames-dark-shadowy-armor-glowing-white-eyes-premium-gaming-art?width=400&height=600&nologo=true&seed=105',
  // Style 2: Sci-Fi / Cyberpunk Anime
  'https://image.pollinations.ai/prompt/cool-cyberpunk-anime-boy-wearing-vr-headset-visor-floating-shattered-rocks-deep-pink-and-blue-neon-sky?width=400&height=600&nologo=true&seed=106',
  'https://image.pollinations.ai/prompt/cyberpunk-sci-fi-girl-with-glowing-vr-goggles-floating-debris-vibrant-purple-and-neon-pink-atmospheric-lighting?width=400&height=600&nologo=true&seed=107',
  'https://image.pollinations.ai/prompt/futuristic-anime-gamer-boy-sleek-high-tech-vr-headset-manipulating-floating-gravity-rocks-cosmic-pink-and-cyan?width=400&height=600&nologo=true&seed=108',
  'https://image.pollinations.ai/prompt/sci-fi-anime-female-character-wearing-cyberpunk-visor-surrounded-by-floating-shattered-crystals-dynamic-neon-pink?width=400&height=600&nologo=true&seed=109',
  'https://image.pollinations.ai/prompt/ethereal-cyberpunk-teenager-with-futuristic-vr-glasses-anti-gravity-floating-rocks-vibrant-magenta-and-cyan?width=400&height=600&nologo=true&seed=110',
  // Style 3: Stylized RPG / Chibi
  'https://image.pollinations.ai/prompt/stylized-3d-anime-blocky-warrior-boy-holding-massive-glowing-blue-crystal-sword-magical-aura-effects?width=400&height=600&nologo=true&seed=111',
  'https://image.pollinations.ai/prompt/cute-chibi-anime-rpg-warrior-female-wielding-giant-glowing-pink-magical-sword-blocky-stylized-art?width=400&height=600&nologo=true&seed=112',
  'https://image.pollinations.ai/prompt/blocky-3d-stylized-rpg-hero-holding-huge-glowing-cyan-energy-sword-spiky-hair-magical-particles?width=400&height=600&nologo=true&seed=113',
  'https://image.pollinations.ai/prompt/chibi-hybrid-anime-warrior-wielding-massive-glowing-gold-and-blue-crystal-broadsword-stylized-3d?width=400&height=600&nologo=true&seed=114',
  'https://image.pollinations.ai/prompt/cute-blocky-fantasy-swordsman-giant-glowing-purple-crystal-blade-glowing-pixel-effects-high-quality-rpg?width=400&height=600&nologo=true&seed=115',
]

export default function HeroAnimation() {
  const [activeAvatars, setActiveAvatars] = useState<string[]>(['', '', ''])

  useEffect(() => {
    const shuffled = [...AVATAR_POOL].sort(() => 0.5 - Math.random())
    setActiveAvatars([shuffled[0], shuffled[1], shuffled[2]])
  }, [])

  return (
    <div className="w-full flex items-center justify-center gap-3 sm:gap-5 -translate-y-12 mb-4 relative z-10">

      {/* Gold Card (Left) */}
      <div className="w-[28%] max-w-[110px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.3)] border border-white/20 translate-y-4 overflow-hidden relative">
        {activeAvatars[0] && (
          <img src={activeAvatars[0]} alt="Gaming Avatar" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Purple Card (Center/Elevated) */}
      <div className="w-[32%] max-w-[125px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-[0_0_30px_rgba(168,85,247,0.5)] z-10 border border-white/30 -translate-y-4 overflow-hidden relative">
        {activeAvatars[1] && (
          <img src={activeAvatars[1]} alt="Gaming Avatar" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Cyan Card (Right) */}
      <div className="w-[28%] max-w-[110px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/20 translate-y-4 overflow-hidden relative">
        {activeAvatars[2] && (
          <img src={activeAvatars[2]} alt="Gaming Avatar" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
        )}
      </div>

    </div>
  )
}
