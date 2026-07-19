'use client'

import React, { useRef, useEffect } from 'react'

const VIDEO_SRC = '/avatars/Cinematic 4K Sunset Live Wallpaper   Relaxing Motion Wallpaper.mp4'

export default function HeroAnimation() {
  const videosRef = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    videosRef.current.forEach((v) => {
      if (v) v.playbackRate = 0.5
    })
  }, [])

  return (
    <div className="w-full flex items-center justify-center gap-3 sm:gap-5 -translate-y-12 mb-4 relative z-10">

      {/* Gold Card (Left) - Left slice */}
      <div className="w-[28%] max-w-[110px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.3)] border border-white/20 translate-y-4 overflow-hidden relative">
        <video
          ref={(el) => { videosRef.current[0] = el }}
          src={VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          className="w-[300%] h-full object-cover"
          style={{ marginLeft: '0%' }}
        />
      </div>

      {/* Purple Card (Center/Elevated) - Center slice */}
      <div className="w-[32%] max-w-[125px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-[0_0_30px_rgba(168,85,247,0.5)] z-10 border border-white/30 -translate-y-4 overflow-hidden relative">
        <video
          ref={(el) => { videosRef.current[1] = el }}
          src={VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          className="w-[300%] h-full object-cover"
          style={{ marginLeft: '-100%' }}
        />
      </div>

      {/* Cyan Card (Right) - Right slice */}
      <div className="w-[28%] max-w-[110px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/20 translate-y-4 overflow-hidden relative">
        <video
          ref={(el) => { videosRef.current[2] = el }}
          src={VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          className="w-[300%] h-full object-cover"
          style={{ marginLeft: '-200%' }}
        />
      </div>

    </div>
  )
}
