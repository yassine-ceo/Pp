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
        bg-[#121212]
        shadow-[inset_0_8px_16px_rgba(0,0,0,0.9),inset_0_0_4px_rgba(0,0,0,0.8)]
        transition-all duration-150
        ${canClick ? 'cursor-pointer hover:bg-[#1a1a1a] hover:shadow-[inset_0_8px_16px_rgba(0,0,0,0.9),inset_0_0_4px_rgba(0,0,0,0.8),0_0_12px_rgba(218,165,32,0.1)] active:scale-[0.96]' : 'cursor-default'}
        ${isWinCell ? 'ring-2 ring-[#daa520]/50 shadow-[inset_0_8px_16px_rgba(0,0,0,0.9),inset_0_0_4px_rgba(0,0,0,0.8),0_0_20px_rgba(218,165,32,0.25)]' : ''}
        flex items-center justify-center
      `}
    >
      {value === 'X' && (
        <span className="text-[#daa520] drop-shadow-[0_10px_8px_rgba(0,0,0,0.8)] font-black text-6xl sm:text-7xl select-none leading-none">
          X
        </span>
      )}
      {value === 'O' && (
        <span className="text-[#c0c0c0] drop-shadow-[0_10px_8px_rgba(0,0,0,0.8)] font-black text-6xl sm:text-7xl select-none leading-none">
          O
        </span>
      )}
      {canClick && (
        <div className="absolute inset-0 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] transition-colors" />
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
    <div className="w-full h-1 rounded-full bg-[#1a1208] overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-700 transition-none shadow-[0_0_6px_rgba(218,165,32,0.4)]"
        style={{ width: `${pct}%` }}
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
      {/* Main frame — thick carved dark wood with bronze rim */}
      <div className="bg-[#1a1a1a] rounded-[2rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_0_0_4px_#3a2612,inset_0_0_0_8px_#141414]">

        {/* Top wooden plaque with rivets */}
        <div className="relative bg-gradient-to-b from-[#3b2a1a] to-[#1f150d] rounded-2xl p-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_8px_16px_rgba(0,0,0,0.6)] mb-3">
          {/* Fake rivets */}
          <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-gradient-to-br from-[#ffd700] to-[#8b6508] shadow-[0_2px_4px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.5)]" />
          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-gradient-to-br from-[#ffd700] to-[#8b6508] shadow-[0_2px_4px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.5)]" />

          <div className="flex items-center justify-between gap-2">
            {/* Player 1 */}
            <div className={`flex-1 min-w-0 transition-all duration-300 ${myActive ? 'opacity-100' : 'opacity-50'}`} style={myActive ? { filter: 'drop-shadow(0 0 8px rgba(218,165,32,0.3))' } : undefined}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  mySymbol === 'X'
                    ? 'bg-gradient-to-br from-[#ffd700]/30 to-[#8b6508]/30 border border-[#ffd700]/40 text-[#ffd700]'
                    : 'bg-gradient-to-br from-[#c0c0c0]/30 to-[#808080]/30 border border-[#c0c0c0]/40 text-[#c0c0c0]'
                }`}>
                  {mySymbol}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-[#d4a853] truncate">
                    {me?.name ?? 'You'}
                  </p>
                  {showTurnTimer && myActive && room?.turnStartTime && (
                    <TurnTimer turnStartTime={room.turnStartTime} />
                  )}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="text-center shrink-0 px-3 sm:px-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl font-black text-[#ffd700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{room?.scores?.p1 ?? 0}</span>
                <span className="text-[#5c3a21] text-lg font-light">:</span>
                <span className="text-lg sm:text-xl font-black text-[#c0c0c0] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{room?.scores?.p2 ?? 0}</span>
              </div>
            </div>

            {/* Player 2 */}
            <div className={`flex-1 min-w-0 transition-all duration-300 ${oppActive ? 'opacity-100' : 'opacity-50'}`} style={oppActive ? { filter: 'drop-shadow(0 0 8px rgba(192,192,192,0.3))' } : undefined}>
              <div className="flex items-center gap-2 justify-end">
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[11px] sm:text-xs font-semibold text-[#d4a853] truncate">
                    {opponent?.name ?? 'Waiting...'}
                  </p>
                  {showTurnTimer && oppActive && room?.turnStartTime && (
                    <TurnTimer turnStartTime={room.turnStartTime} />
                  )}
                </div>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  oppSymbol === 'X'
                    ? 'bg-gradient-to-br from-[#ffd700]/30 to-[#8b6508]/30 border border-[#ffd700]/40 text-[#ffd700]'
                    : 'bg-gradient-to-br from-[#c0c0c0]/30 to-[#808080]/30 border border-[#c0c0c0]/40 text-[#c0c0c0]'
                }`}>
                  {oppSymbol}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Grid — bronze/gold metallic skeleton */}
        <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-[#8b6508] via-[#b8860b] to-[#5c4008] p-2 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
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
