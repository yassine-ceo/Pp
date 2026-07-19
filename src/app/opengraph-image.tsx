import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PlayOnline Game Studio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #020617)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 110 70" width="330" height="210">
          <circle cx="68" cy="35" r="21" fill="none" stroke="#ffffff" strokeWidth="7.5" />
          <circle cx="35" cy="35" r="21" fill="none" stroke="#ffffff" strokeWidth="7.5" />
          <line x1="14" y1="35" x2="14" y2="68" stroke="#ffffff" strokeWidth="7.5" />
          <path d="M 28 22 L 47 35 L 28 48 Z" fill="#38bdf8" />
        </svg>
        <div style={{ color: 'white', fontSize: 105, fontFamily: 'sans-serif', fontWeight: 900, letterSpacing: '-0.03em', marginLeft: 40 }}>
          PlayOnline
        </div>
      </div>
    ),
    { ...size }
  )
}
