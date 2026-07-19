import React from 'react'

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-48 flex items-center justify-center overflow-hidden">
      {/* Middle Connection Line */}
      <div className="absolute w-24 h-[2px] bg-gradient-to-r from-purple-500 via-white to-cyan-500 animate-pulse"></div>

      {/* Avatars */}
      <div className="flex gap-16">
        <div className="w-16 h-16 rounded-full border-2 border-purple-500 bg-black shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500 bg-black shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
      </div>

      {/* Phone Elements (Abstract) */}
      <div className="absolute bottom-4 flex gap-24">
         <div className="w-8 h-12 border-2 border-purple-500/50 rounded-lg"></div>
         <div className="w-8 h-12 border-2 border-cyan-500/50 rounded-lg"></div>
      </div>
    </div>
  )
}
