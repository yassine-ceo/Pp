'use client'

import { useMemo, useCallback, useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { makeMove } from '@/lib/firebase'
import { soundManager } from '@/lib/sound'
import { TURN_TIME_LIMIT } from '@/lib/types'

interface CellProps {
  index: number
  value: string
  onClick: (index: number) => void
  isWinCell: boolean
  isMyTurn: boolean
}

function GoldX() {
  return (
    <span
      className="font-black text-6xl sm:text-7xl select-none leading-none"
      style={{
        background: 'linear-gradient(160deg, #ffd700 0%, #b8860b 40%, #daa520 60%, #8b6508 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.7))',
      }}
    >
      X
    </span>
  )
}

function SilverO() {
  return (
    <span
      className="font-black text-6xl sm:text-7xl select-none leading-none"
      style={{
        background: 'linear-gradient(160deg, #e8e8e8 0%, #a0a0a0 40%, #c8c8c8 60%, #808080 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.7))',
      }}
    >
      O
    </span>
  )
}

function Cell({ index, value, onClick, isWinCell, isMyTurn }: CellProps) {
  const isEmpty = value === ''
  const canClick = isEmpty && isMyTurn

  const handleClick = useCallback(() => {
    if (!canClick) return
    onClick(index)
  }, [canClick, index, onClick])

  return (
    <button
      onClick={handleClick}
      disabled={!canClick}
      className={`
        relative w-full aspect-square rounded-lg
        bg-[#0e0e0e]
        transition-all duration-150
        ${canClick
          ? 'cursor-pointer hover:bg-[#161616] active:scale-[0.96]'
          : 'cursor-default'
        }
        ${isWinCell ? 'ring-2 ring-[#daa520]/40' : ''}
        flex items-center justify-center
      `}
      style={{
        boxShadow: isWinCell
          ? 'inset 0 6px 12px rgba(0,0,0,0.9), inset 0 0 4px rgba(0,0,0,0.5), 0 0 15px rgba(218,165,32,0.15)'
          : 'inset 0 6px 12px rgba(0,0,0,0.9), inset 0 0 4px rgba(0,0,0,0.5)',
      }}
    >
      {value === 'X' && <GoldX />}
      {value === 'O' && <SilverO />}
      {canClick && (
        <div className="absolute inset-0 rounded-lg bg-white/[0.01] hover:bg-white/[0.025] transition-colors" />
      )}
    </button>
  )
}

function TurnTimer({ turnStartTime }: { turnStartTime: number }) {
  const [pct, setPct] = useState(100)

  useEffect(() => {
    let raf: number
    const tick = () => {
      const elapsed = Date.now() - turnStartTime
      const remaining = Math.max(0, TURN_TIME_LIMIT - elapsed)
      setPct((remaining / TURN_TIME_LIMIT) * 100)
      if (remaining > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [turnStartTime])

  return (
    <div className="w-full h-[3px] rounded-full overflow-hidden mt-1.5" style={{ background: 'linear-gradient(to right, #1a120d, #2b1d14)' }}>
      <div
        className="h-full rounded-full transition-none"
        style={{
          width: `${pct}%`,
          background: pct > 50
            ? 'linear-gradient(to right, #8b6508, #b8860b)'
            : pct > 20
            ? 'linear-gradient(to right, #b8860b, #daa520)'
            : 'linear-gradient(to right, #a0522d, #cd853f)',
          boxShadow: pct > 20 ? '0 0 6px rgba(184,134,11,0.4)' : '0 0 6px rgba(205,133,63,0.4)',
        }}
      />
    </div>
  )
}

export default function GameBoard() {
  const { localBoard, roomId, playerId, room, applyOptimisticMove, winHighlightCells } = useGameStore()

  const mySymbol = useMemo(() => {
    if (!room || !playerId) return 'X'
    return room.players?.p1?.id === playerId ? 'X' : 'O'
  }, [room, playerId])

  const isMyTurn = room?.turn === playerId && room?.status === 'playing'
  const oppSymbol = mySymbol === 'X' ? 'O' : 'X'

  const winSet = useMemo(() => new Set(winHighlightCells), [winHighlightCells])

  const me = room?.players?.p1?.id === playerId ? room?.players?.p1 : room?.players?.p2
  const opponent = room?.players?.p1?.id === playerId ? room?.players?.p2 : room?.players?.p1

  const handleCellClick = useCallback((index: number) => {
    if (!roomId || !room || !playerId) return
    if (room.status !== 'playing') return
    if (room.turn !== playerId) return
    if (localBoard[index] !== '') return

    const symbol = room.players?.p1?.id === playerId ? 'X' : 'O'
    applyOptimisticMove(index, symbol)
    if (symbol === 'X') soundManager.playPlaceX()
    else soundManager.playPlaceO()
    makeMove(roomId, playerId, index, room.board, room.turn)
  }, [roomId, room, playerId, localBoard, applyOptimisticMove])

  const showTurnTimer = room?.status === 'playing' && room?.turn && room?.turnStartTime
  const myActive = isMyTurn
  const oppActive = room?.turn !== playerId && room?.status === 'playing' && !!opponent

  return (
    <div className="w-full max-w-[380px] mx-auto select-none pointer-events-auto">
      {/* Main frame — dark polished rosewood with bronze inset rim */}
      <div
        className="rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #2b1d14, #1a120d)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7), 0 8px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.3)',
          border: '3px solid #3a2612',
          padding: '14px',
        }}
      >
        {/* Inner border — thin bronze line */}
        <div
          className="rounded-[1.2rem] sm:rounded-[1.6rem] p-3 sm:p-4"
          style={{
            border: '1px solid rgba(139,101,8,0.3)',
            background: 'linear-gradient(to bottom, rgba(43,29,20,0.5), rgba(26,18,13,0.8))',
          }}
        >
          {/* Header plaque — mounted wooden plate */}
          <div
            className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3"
            style={{
              background: 'linear-gradient(to bottom, #2e2015, #1c140e)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
              border: '1.5px solid #3a2612',
            }}
          >
            {/* Rivets */}
            <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #daa520, #8b6508)', boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)' }} />
            <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #daa520, #8b6508)', boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)' }} />

            <div className="flex items-center justify-between gap-2">
              {/* Player 1 */}
              <div className={`flex-1 min-w-0 transition-all duration-300 ${myActive ? 'opacity-100' : 'opacity-40'}`}>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        mySymbol === 'X' ? 'text-[#daa520]' : 'text-[#c0c0c0]'
                      }`}
                      style={{
                        background: mySymbol === 'X'
                          ? 'linear-gradient(135deg, rgba(218,165,32,0.2), rgba(139,101,8,0.15))'
                          : 'linear-gradient(135deg, rgba(192,192,192,0.2), rgba(128,128,128,0.15))',
                        border: `1.5px solid ${mySymbol === 'X' ? 'rgba(218,165,32,0.3)' : 'rgba(192,192,192,0.3)'}`,
                      }}
                    >
                      {mySymbol}
                    </div>
                    {/* LED turn indicator */}
                    {myActive && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{
                          background: 'radial-gradient(circle, #ffd700, #b8860b)',
                          boxShadow: '0 0 8px #ffd700, 0 0 4px #ffd700',
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs font-semibold text-[#c4a35a] truncate">{me?.name ?? 'You'}</p>
                    {showTurnTimer && myActive && room?.turnStartTime && (
                      <TurnTimer turnStartTime={room.turnStartTime} />
                    )}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-center shrink-0 px-3 sm:px-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl font-black text-[#c4a35a]">{room?.scores?.p1 ?? 0}</span>
                  <span className="text-[#4a3520] text-lg font-light">:</span>
                  <span className="text-lg sm:text-xl font-black text-[#a0a0a0]">{room?.scores?.p2 ?? 0}</span>
                </div>
              </div>

              {/* Player 2 */}
              <div className={`flex-1 min-w-0 transition-all duration-300 ${oppActive ? 'opacity-100' : 'opacity-40'}`}>
                <div className="flex items-center gap-2 justify-end">
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-[11px] sm:text-xs font-semibold text-[#c4a35a] truncate">{opponent?.name ?? 'Waiting...'}</p>
                    {showTurnTimer && oppActive && room?.turnStartTime && (
                      <TurnTimer turnStartTime={room.turnStartTime} />
                    )}
                  </div>
                  <div className="relative">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        oppSymbol === 'X' ? 'text-[#daa520]' : 'text-[#c0c0c0]'
                      }`}
                      style={{
                        background: oppSymbol === 'X'
                          ? 'linear-gradient(135deg, rgba(218,165,32,0.2), rgba(139,101,8,0.15))'
                          : 'linear-gradient(135deg, rgba(192,192,192,0.2), rgba(128,128,128,0.15))',
                        border: `1.5px solid ${oppSymbol === 'X' ? 'rgba(218,165,32,0.3)' : 'rgba(192,192,192,0.3)'}`,
                      }}
                    >
                      {oppSymbol}
                    </div>
                    {oppActive && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{
                          background: oppSymbol === 'X'
                            ? 'radial-gradient(circle, #ffd700, #b8860b)'
                            : 'radial-gradient(circle, #e0e0e0, #a0a0a0)',
                          boxShadow: oppSymbol === 'X'
                            ? '0 0 8px #ffd700, 0 0 4px #ffd700'
                            : '0 0 8px #c0c0c0, 0 0 4px #c0c0c0',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid — bronze metallic skeleton */}
          <div
            className="grid grid-cols-3 gap-[6px] sm:gap-2 rounded-xl sm:rounded-2xl p-2 sm:p-2.5"
            style={{
              background: 'linear-gradient(145deg, #b8860b, #5c4008)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
            }}
          >
            {localBoard.map((cell, index) => (
              <Cell
                key={index}
                index={index}
                value={cell}
                onClick={handleCellClick}
                isWinCell={winSet.has(index)}
                isMyTurn={isMyTurn}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
