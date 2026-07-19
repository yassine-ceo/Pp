'use client'

import React from 'react'

export default function HeroAnimation() {
  return (
    <div className="w-full h-auto flex items-center justify-center py-10 mt-4 overflow-hidden">

      <div className="relative w-[90vw] max-w-[400px] flex justify-center items-center gap-[4%]">

        {/* Left Card */}
        <div className="w-[30%] aspect-[3/4] rounded-[4vw] sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(251,191,36,0.25)] border border-white/10"></div>

        {/* Center Card (Elevated Podium) */}
        <div className="w-[34%] aspect-[3/4] rounded-[4vw] sm:rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-[0_10px_30px_rgba(168,85,247,0.4)] border border-white/20 z-10 -translate-y-[10%]"></div>

        {/* Right Card */}
        <div className="w-[30%] aspect-[3/4] rounded-[4vw] sm:rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.25)] border border-white/10"></div>

      </div>

    </div>
  )
}
