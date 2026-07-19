'use client'

import React from 'react'

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center overflow-hidden perspective-1000">

      {/* Gold Card (Left - Clipped) */}
      <div className="absolute left-[-20px] w-32 h-44 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-2xl rotate-[-15deg] skew-y-6 border border-white/20 z-10 animate-float-slow"></div>

      {/* Purple Card (Center - Main) */}
      <div className="relative w-40 h-56 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-2xl z-20 flex items-center justify-center border border-white/20 animate-float-main">
         <span className="text-white/20 font-black text-6xl">P</span>
      </div>

      {/* Cyan Card (Right - Clipped) */}
      <div className="absolute right-[-20px] w-32 h-44 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl rotate-[15deg] skew-y-[-6deg] border border-white/20 z-10 animate-float-slow"></div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .animate-float-slow { animation: float 6s ease-in-out infinite; }
        .animate-float-main { animation: float 4s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  )
}
