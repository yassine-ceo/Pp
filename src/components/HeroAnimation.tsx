'use client'

import React from 'react'

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-[35vh] flex items-center justify-center overflow-hidden mt-4" style={{ perspective: '1000px' }}>

      {/* Background Cards (Responsive widths) */}
      <div className="absolute flex gap-[2vw] opacity-70">
        <div className="w-[20vw] h-[30vh] rounded-[2vw] bg-gradient-to-br from-yellow-400 to-amber-600 shadow-xl -rotate-6"></div>
        <div className="w-[20vw] h-[30vh] rounded-[2vw] bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-xl"></div>
        <div className="w-[20vw] h-[30vh] rounded-[2vw] bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl rotate-6"></div>
      </div>

      {/* Foreground Main Card (Responsive width) */}
      <div className="relative z-10 w-[40vw] h-[35vh] rounded-[2vw] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-[15deg] border border-white/30 flex items-center justify-center transition-transform duration-500 hover:rotate-0">
        <span className="text-white font-black text-[10vw] opacity-50 select-none">3D</span>
      </div>

    </div>
  )
}
