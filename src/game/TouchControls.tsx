'use client'

import { useRef, useCallback, useEffect } from 'react'

export default function TouchControls() {
  const touchState = useRef({ left: false, right: false, jump: false })

  const updatePhaser = useCallback(() => {
    const w = window as any
    const api = w.__phaserControls?.current
    if (!api) return
    const { setLobbyControls, setLevelControls, currentSceneRef } = api
    const controls = {
      left: touchState.current.left,
      right: touchState.current.right,
      jump: touchState.current.jump,
    }
    if (currentSceneRef.current === 'lobby') {
      setLobbyControls(controls)
    } else {
      setLevelControls(controls)
    }
  }, [])

  const handlePointerDown = useCallback((dir: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    if (dir === 'left') touchState.current.left = true
    else if (dir === 'right') touchState.current.right = true
    else if (dir === 'jump') touchState.current.jump = true
    updatePhaser()
  }, [updatePhaser])

  const handlePointerUp = useCallback((dir: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    if (dir === 'left') touchState.current.left = false
    else if (dir === 'right') touchState.current.right = false
    else if (dir === 'jump') touchState.current.jump = false
    updatePhaser()
  }, [updatePhaser])

  const handleShoot = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const w = window as any
    w.__phaserControls?.current?.fireShoot?.()
  }, [])

  const btnClass = 'select-none touch-none flex items-center justify-center rounded-2xl backdrop-blur-md transition-all active:scale-90 pointer-events-auto'

  const arrowBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
    WebkitTapHighlightColor: 'transparent',
    width: 'auto',
    height: '52px',
    padding: '0 18px',
    minWidth: '72px',
  }

  const jumpBtnStyle: React.CSSProperties = {
    background: 'rgba(212,168,75,0.10)',
    border: '1px solid rgba(212,168,75,0.2)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(212,168,75,0.06)',
    WebkitTapHighlightColor: 'transparent',
    width: '68px',
    height: '68px',
    borderRadius: '1rem',
  }

  const shootBtnStyle: React.CSSProperties = {
    background: 'rgba(255,80,40,0.10)',
    border: '1px solid rgba(255,80,40,0.2)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,80,40,0.06)',
    WebkitTapHighlightColor: 'transparent',
    width: '58px',
    height: '58px',
    borderRadius: '1rem',
  }

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const w = window as any
      const api = w.__phaserControls?.current
      if (!api) return
      const { setLobbyControls, setLevelControls, currentSceneRef } = api
      const isLobby = currentSceneRef.current === 'lobby'
      const controls = {
        left: e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft',
        right: e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight',
        jump: e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === ' ',
      }
      if (isLobby) setLobbyControls(controls)
      else setLevelControls(controls)
    }
    window.addEventListener('keydown', handler)
    window.addEventListener('keyup', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('keyup', handler)
    }
  }, [])

  return (
    <div className="absolute inset-0 z-40" style={{ touchAction: 'none' }}>
      {/* Bottom-left: movement buttons */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2.5">
        <button
          onPointerDown={handlePointerDown('left')}
          onPointerUp={handlePointerUp('left')}
          onPointerLeave={handlePointerUp('left')}
          className={btnClass}
          style={arrowBtnStyle}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onPointerDown={handlePointerDown('right')}
          onPointerUp={handlePointerUp('right')}
          onPointerLeave={handlePointerUp('right')}
          className={btnClass}
          style={arrowBtnStyle}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Bottom-right: jump (corner) + shoot (above-left of jump) */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <button
          onPointerDown={handlePointerDown('jump')}
          onPointerUp={handlePointerUp('jump')}
          onPointerLeave={handlePointerUp('jump')}
          className={btnClass}
          style={jumpBtnStyle}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ color: '#d4a84b' }}>
            <path d="M12 3l-6 8h12l-6-8z" />
            <rect x="5" y="13" width="14" height="3" rx="1" />
          </svg>
        </button>
        <button
          onPointerDown={handleShoot}
          className={btnClass}
          style={{ ...shootBtnStyle, position: 'absolute', bottom: '76px', right: '10px' }}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" style={{ color: '#ff5028' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
