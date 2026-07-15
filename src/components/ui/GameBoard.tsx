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
        color: '#ffd700',
        filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.8))',
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
        color: '#c0c0c0',
        filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.8))',
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
        relative w-full aspect-square rounded-xl
        bg-[#1c1c1c]
        ${canClick
          ? 'cursor-pointer hover:bg-[#242424] active:scale-[0.96]'
          : 'cursor-default'
        }
        ${isWinCell ? 'ring-2 ring-[#daa520]/50' : ''}
        flex items-center justify-center
      `}
      style={{
        boxShadow: isWinCell
          ? 'inset 0 4px 10px rgba(0,0,0,0.8), 0 0 15px rgba(218,165,32,0.15)'
          : 'inset 0 4px 10px rgba(0,0,0,0.8)',
      }}
    >
      {value === 'X' && <GoldX />}
      {value === 'O' && <SilverO />}
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
      {/* Main frame — thick bronze border, dark vintage interior */}
      <div
        className="rounded-[2rem] overflow-hidden"
        style={{
          background: '#1a1c20',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3)',
          border: '12px solid #8b6508',
        }}
      >
        {/* Header plaque — carved dark wood with player profiles */}
        <div
          className="relative rounded-2xl p-4 mb-4 mx-2 mt-2"
          style={{
            background: 'linear-gradient(to bottom, #3a2318, #24150d)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
            border: '2px solid #5c3a21',
          }}
        >
          {/* Rivets */}
          <div className="absolute top-3 left-3 w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #daa520, #8b6508)', boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)' }} />
          <div className="absolute top-3 right-3 w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #daa520, #8b6508)', boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)' }} />

          <div className="flex items-center justify-between gap-2">
            {/* Player 1 */}
            <div className={`flex-1 min-w-0 transition-opacity duration-200 ${myActive ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #2e2015, #1c140e)',
                    border: '1.5px solid rgba(139,101,8,0.4)',
                    color: '#e1c699',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {mySymbol}
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
            <div className={`flex-1 min-w-0 transition-opacity duration-200 ${oppActive ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex items-center gap-2 justify-end">
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[11px] sm:text-xs font-semibold text-[#c4a35a] truncate">{opponent?.name ?? 'Waiting...'}</p>
                  {showTurnTimer && oppActive && room?.turnStartTime && (
                    <TurnTimer turnStartTime={room.turnStartTime} />
                  )}
                </div>
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #2e2015, #1c140e)',
                    border: '1.5px solid rgba(139,101,8,0.4)',
                    color: '#e1c699',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {oppSymbol}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid — bronze metallic skeleton */}
        <div
          className="grid grid-cols-3 gap-3 rounded-2xl p-3 mx-2 mb-2"
          style={{
            background: '#6b4c1a',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)',
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
  )
}
