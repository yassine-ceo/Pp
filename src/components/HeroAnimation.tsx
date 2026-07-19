'use client'

import React from 'react'

export default function HeroAnimation() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center gap-2 md:gap-4" style={{ perspective: '1000px' }}>

      {/* Gold Card — tilted left */}
      <div style={{ transform: 'rotateY(12deg)' }}>
        <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-float border border-white/20"></div>
      </div>

      {/* Purple Card (Main) — center */}
      <div className="z-10">
        <div className="w-24 h-32 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-float-delayed border border-white/30"></div>
      </div>

      {/* Cyan Card — tilted right */}
      <div style={{ transform: 'rotateY(-12deg)' }}>
        <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-float border border-white/20"></div>
      </div>

      <style jsx global>{`
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out infinite 1.5s; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}
