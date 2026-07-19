'use client'

import React from 'react'

export default function HeroAnimation() {
  return (
    <div className="w-full flex justify-center items-center gap-3 px-4 mt-6">

      {/* Gold Card */}
      <div className="w-1/3 aspect-[3/4] max-w-[120px] rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]"></div>

      {/* Purple Card */}
      <div className="w-1/3 aspect-[3/4] max-w-[120px] rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-[0_0_15px_rgba(168,85,247,0.3)]"></div>

      {/* Cyan Card */}
      <div className="w-1/3 aspect-[3/4] max-w-[120px] rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"></div>

    </div>
  )
}
