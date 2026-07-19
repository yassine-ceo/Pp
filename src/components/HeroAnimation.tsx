'use client'

import React from 'react'

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-80 flex items-center justify-center overflow-hidden mt-4" style={{ perspective: '1000px' }}>

      {/* Background Cards (The 3 Cards) */}
      <div className="absolute flex gap-4 opacity-70">
        <div className="w-24 h-36 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-xl -rotate-6"></div>
        <div className="w-24 h-36 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-xl"></div>
        <div className="w-24 h-36 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl rotate-6"></div>
      </div>

      {/* Foreground Main Card (The Tilted 3D Card) */}
      <div className="relative z-10 w-48 h-64 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-[15deg] border border-white/30 flex items-center justify-center transform hover:rotate-0 transition-transform duration-500">
        <span className="text-white font-black text-4xl opacity-50 select-none">3D</span>
      </div>

    </div>
  )
}
