'use client'

import React from 'react'

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-[40vh] flex items-center justify-center perspective-[1200px] overflow-hidden mt-8">

      {/* Cards Container with 3D transform */}
      <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>

        {/* Card 1 (Back/Left) */}
        <div className="absolute w-[25vw] h-[35vh] rounded-[2vw] bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl -rotate-[10deg] -translate-x-[15vw] z-10"></div>

        {/* Card 2 (Back/Right) */}
        <div className="absolute w-[25vw] h-[35vh] rounded-[2vw] bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl rotate-[10deg] translate-x-[15vw] z-10"></div>

        {/* Main 3D Card (Front) */}
        <div className="relative w-[35vw] h-[40vh] rounded-[2vw] bg-gradient-to-br from-indigo-500/30 to-purple-500/30 backdrop-blur-lg border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.1)] rotate-[5deg] z-20 flex items-center justify-center animate-pulse">
            <span className="text-white/80 font-black text-[8vw] drop-shadow-lg">3D</span>
        </div>

      </div>
    </div>
  )
}
