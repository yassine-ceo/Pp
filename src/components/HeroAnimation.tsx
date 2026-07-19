'use client'

import React, { useState, useEffect } from 'react'

const AVATAR_POOL: string[] = [
  'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=400&h=600&q=80',
  'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=400&h=600&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&h=600&q=80',
  'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&h=600&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&h=600&q=80',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=400&h=600&q=80',
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
