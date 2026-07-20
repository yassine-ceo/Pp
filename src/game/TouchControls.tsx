'use client'

import { useRef, useCallback, useEffect } from 'react'

interface TouchControlsProps {
  scene: 'lobby' | 'level1'
}

export default function TouchControls({ scene }: TouchControlsProps) {
  const touchState = useRef({ left: false, right: false, up: false, down: false, jump: false })

  const updatePhaser = useCallback(() => {
    const w = window as any
    const api = w.__phaserControls?.current
    if (!api) return
    const { currentSceneRef, setLobbyControls, setLevelControls } = api
    if (scene === 'lobby') {
      setLobbyControls({
        left: touchState.current.left,
        right: touchState.current.right,
        up: touchState.current.up,
        down: touchState.current.down,
      })
    } else {
      setLevelControls({
        left: touchState.current.left,
        right: touchState.current.right,
        jump: touchState.current.jump,
      })
    }
  }, [scene])

  const handlePointerDown = useCallback((dir: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (dir === 'left') touchState.current.left = true
    else if (dir === 'right') touchState.current.right = true
    else if (dir === 'up') touchState.current.up = true
    else if (dir === 'down') touchState.current.down = true
    else if (dir === 'jump') touchState.current.jump = true
    updatePhaser()
  }, [updatePhaser])

  const handlePointerUp = useCallback((dir: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    if (dir === 'left') touchState.current.left = false
    else if (dir === 'right') touchState.current.right = false
    else if (dir === 'up') touchState.current.up = false
    else if (dir === 'down') touchState.current.down = false
    else if (dir === 'jump') touchState.current.jump = false
    updatePhaser()
  }, [updatePhaser])

  const btnClass = 'select-none touch-none flex items-center justify-center rounded-2xl backdrop-blur-xl transition-all active:scale-90'
  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
    WebkitTapHighlightColor: 'transparent',
    width: '64px',
    height: '64px',
  }

  const arrowBtnStyle: React.CSSProperties = {
    ...btnStyle,
    width: 'auto',
    height: '56px',
    padding: '0 20px',
    minWidth: '80px',
  }

  // Also support keyboard
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const w = window as any
      const api = w.__phaserControls?.current
      if (!api) return
      const { currentSceneRef, setLobbyControls, setLevelControls } = api
      const cs = currentSceneRef.current
      if (cs !== scene) return

      if (scene === 'lobby') {
        setLobbyControls({
          left: e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft',
          right: e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight',
          up: e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp',
          down: e.key === 's' || e.key === 'S' || e.key === 'ArrowDown',
        })
      } else {
        setLevelControls({
          left: e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft',
          right: e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight',
          jump: e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === ' ',
        })
      }
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', kd)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', kd)
    }
  }, [scene])

  return (
    <div className="fixed inset-0 pointer-events-none z-40" style={{ touchAction: 'none' }}>
      {/* Left side — directional */}
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

      {/* Right side — action buttons */}
      <div className="absolute right-4 bottom-8 flex items-center gap-3 pointer-events-auto">
        {scene === 'level1' && (
          <button
            onPointerDown={handlePointerDown('jump')}
            onPointerUp={handlePointerUp('jump')}
            onPointerLeave={handlePointerUp('jump')}
            className={btnClass}
            style={{ ...btnStyle, width: '72px', height: '72px', background: 'rgba(212,168,75,0.12)', borderColor: 'rgba(212,168,75,0.25)' }}
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" style={{ color: '#d4a84b' }}>
              <path d="M12 3l-6 8h12l-6-8z" />
              <rect x="5" y="13" width="14" height="3" rx="1" />
            </svg>
          </button>
        )}
        {scene === 'lobby' && (
          <>
            <button
              onPointerDown={handlePointerDown('up')}
              onPointerUp={handlePointerUp('up')}
              onPointerLeave={handlePointerUp('up')}
              className={btnClass}
              style={btnStyle}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
            <button
              onPointerDown={handlePointerDown('down')}
              onPointerUp={handlePointerUp('down')}
              onPointerLeave={handlePointerUp('down')}
              className={btnClass}
              style={btnStyle}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
