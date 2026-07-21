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

  const btnClass = 'select-none touch-none flex items-center justify-center rounded-2xl backdrop-blur-xl transition-all active:scale-90'
  const arrowBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
    WebkitTapHighlightColor: 'transparent',
    width: 'auto',
    height: '56px',
    padding: '0 20px',
    minWidth: '80px',
  }

  const jumpBtnStyle: React.CSSProperties = {
    background: 'rgba(212,168,75,0.12)',
    border: '1px solid rgba(212,168,75,0.25)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(212,168,75,0.08)',
    WebkitTapHighlightColor: 'transparent',
    width: '72px',
    height: '72px',
    borderRadius: '1rem',
  }

  const shootBtnStyle: React.CSSProperties = {
    background: 'rgba(255,80,40,0.12)',
    border: '1px solid rgba(255,80,40,0.25)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,80,40,0.08)',
    WebkitTapHighlightColor: 'transparent',
    width: '64px',
    height: '64px',
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
    <div className="fixed inset-0 pointer-events-none z-40" style={{ touchAction: 'none' }}>
      <div className="absolute left-4 bottom-8 flex items-center gap-3 pointer-events-auto">
        <button
          onPointerDown={handlePointerDown('left')}
          onPointerUp={handlePointerUp('left')}
          onPointerLeave={handlePointerUp('left')}
          className={btnClass}
          style={arrowBtnStyle}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.6)' }}>
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
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="absolute right-4 bottom-8 flex flex-col items-center gap-3 pointer-events-auto">
        <button
          onPointerDown={handleShoot}
          className={btnClass}
          style={shootBtnStyle}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ color: '#ff5028' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </button>
        <button
          onPointerDown={handlePointerDown('jump')}
          onPointerUp={handlePointerUp('jump')}
          onPointerLeave={handlePointerUp('jump')}
          className={btnClass}
          style={jumpBtnStyle}
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" style={{ color: '#d4a84b' }}>
            <path d="M12 3l-6 8h12l-6-8z" />
            <rect x="5" y="13" width="14" height="3" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  )
}
