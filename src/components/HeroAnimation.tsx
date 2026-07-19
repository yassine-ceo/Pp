'use client'

import React, { useState, useEffect } from 'react'

const AVATARS: string[] = [
  // Dark Fantasy (1-5)
  'https://image.pollinations.ai/prompt/Dark%20fantasy%20warrior%20with%20glowing%20blue%20magical%20fire%20glowing%20eyes%20dark%20cloak%20mysterious%20atmosphere%20highly%20detailed%20digital%20art%20portrait?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Dark%20fantasy%20female%20sorcerer%20with%20neon%20blue%20flames%20dark%20hooded%20robe%20magical%20aura%20glowing%20runes%20detailed%20digital%20painting%20portrait?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Dark%20fantasy%20assassin%20with%20glowing%20ice%20blue%20eyes%20dark%20leather%20armor%20magical%20frost%20effects%20cinematic%20lighting%20detailed%20character%20art?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Dark%20fantasy%20knight%20with%20glowing%20cyan%20enchanted%20sword%20dark%20plate%20armor%20mystical%20blue%20flames%20epic%20fantasy%20portrait?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Dark%20fantasy%20oracle%20with%20glowing%20white%20eyes%20dark%20hood%20ethereal%20blue%20mist%20magical%20particles%20highly%20detailed%20portrait?width=400&height=600&nologo=true',
  // Sci-Fi / Cyberpunk Anime (6-10)
  'https://image.pollinations.ai/prompt/Cyberpunk%20anime%20character%20with%20VR%20headset%20floating%20shattered%20rocks%20vibrant%20pink%20purple%20atmosphere%20neon%20glow%20detailed%20digital%20art?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Sci-fi%20anime%20warrior%20with%20tech%20visor%20holographic%20display%20deep%20blue%20purple%20background%20cyberpunk%20aesthetic%20highly%20detailed%20portrait?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Cyberpunk%20female%20hacker%20with%20neural%20interface%20glowing%20pink%20circuits%20floating%20digital%20fragments%20anime%20style%20detailed%20portrait?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Sci-fi%20mech%20pilot%20with%20visor%20electric%20blue%20energy%20floating%20debris%20vibrant%20purple%20atmosphere%20anime%20character%20art?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Cyberpunk%20street%20samurai%20with%20augmented%20reality%20eyes%20neon%20pink%20blue%20lighting%20shattered%20glass%20effects%20detailed%20anime%20style?width=400&height=600&nologo=true',
  // Stylized RPG / Chibi (11-15)
  'https://image.pollinations.ai/prompt/Chibi%20warrior%20holding%20massive%20glowing%20crystal%20sword%20magical%20aura%20RPG%20style%203D%20rendered%20highly%20detailed%20cute%20but%20epic?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Stylized%20RPG%20mage%20with%20giant%20glowing%20staff%20magical%20particles%20chibi%20proportions%20vibrant%20colors%203D%20rendered%20character?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Chibi%20knight%20with%20oversized%20crystal%20shield%20magical%20blue%20aura%20RPG%20fantasy%203D%20blocky%20style%20detailed%20character?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Stylized%20RPG%20assassin%20with%20dual%20glowing%20daggers%20magical%20effects%20chibi%20anime%20hybrid%203D%20rendered%20epic%20pose?width=400&height=600&nologo=true',
  'https://image.pollinations.ai/prompt/Chibi%20paladin%20with%20massive%20glowing%20hammer%20holy%20light%20effects%20RPG%20style%203D%20rendered%20detailed%20fantasy%20character?width=400&height=600&nologo=true',
]

const imgClass = 'w-full h-full object-cover rounded-xl sm:rounded-2xl opacity-90 hover:opacity-100 transition-opacity'

export default function HeroAnimation() {
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const shuffled = [...AVATARS].sort(() => Math.random() - 0.5)
    setSelected(shuffled.slice(0, 3))
  }, [])

  return (
    <div className="w-full flex items-center justify-center gap-3 sm:gap-5 -translate-y-12 mb-4 relative z-10">

      {/* Gold Card (Left) */}
      <div className="w-[28%] max-w-[110px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.3)] border border-white/20 translate-y-4 overflow-hidden">
        {selected[0] && <img src={selected[0]} alt="Gaming avatar" className={imgClass} />}
      </div>

      {/* Purple Card (Center/Elevated) */}
      <div className="w-[32%] max-w-[125px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-700 shadow-[0_0_30px_rgba(168,85,247,0.5)] z-10 border border-white/30 -translate-y-4 overflow-hidden">
        {selected[1] && <img src={selected[1]} alt="Gaming avatar" className={imgClass} />}
      </div>

      {/* Cyan Card (Right) */}
      <div className="w-[28%] max-w-[110px] aspect-[3/4] rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/20 translate-y-4 overflow-hidden">
        {selected[2] && <img src={selected[2]} alt="Gaming avatar" className={imgClass} />}
      </div>

    </div>
  )
}
