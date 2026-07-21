'use client'

interface DungeonRunProps {
  onBack: () => void
}

export default function DungeonRun({ onBack }: DungeonRunProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-all"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>
      <iframe
        src="/assets/FireBoy-and-WaterGirl-main/index.html"
        className="w-full h-full border-0"
        title="FireBoy and WaterGirl"
      />
    </div>
  )
}
