'use client'

import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
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
        relative w-full aspect-square rounded-xl
        bg-[#1c1c1c]
        shadow-[inset_0_4px_10px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(0,0,0,0.5)]
        transition-all duration-150
        ${canClick ? 'cursor-pointer hover:bg-[#252525] hover:shadow-[inset_0_4px_10px_rgba(0,0,0,0.8),inset_0_1px_3px_rgba(0,0,0,0.5),0_0_15px_rgba(139,101,8,0.15)] active:scale-[0.97]' : 'cursor-default'}
        ${isWinCell ? 'ring-2 ring-[#ffd700]/60 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8),0_0_20px_rgba(255,215,0,0.2)]' : ''}
        flex items-center justify-center
      `}
    >
      {value === 'X' && (
        <span className="text-[#ffd700] drop-shadow-[0_4px_2px_rgba(0,0,0,0.8)] font-black text-6xl sm:text-7xl select-none leading-none">
          X
        </span>
      )}
      {value === 'O' && (
        <span className="text-[#c0c0c0] drop-shadow-[0_4px_2px_rgba(0,0,0,0.8)] font-black text-6xl sm:text-7xl select-none leading-none">
          O
        </span>
      )}
      {canClick && (
        <div className="absolute inset-0 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors" />
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
    <div className="w-full h-1.5 rounded-full bg-[#24150d] overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-none"
        style={{
          width: `${pct}%`,
          backgroundColor: pct > 50 ? '#8b6508' : pct > 20 ? '#d4a853' : '#ef4444',
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
  const isOppTurn = room?.turn !== playerId && room?.status === 'playing' && opponent

  return (
    <div className="w-full max-w-[380px] mx-auto select-none pointer-events-auto">
      {/* Main frame container */}
      <div className="bg-[#1a1c20] border-[10px] sm:border-[12px] border-[#8b6508] rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="bg-gradient-to-b from-[#1a1c20] to-[#14161a] p-3 sm:p-4">

          {/* Header: Player profiles + score */}
          <div className="bg-gradient-to-b from-[#3a2318] to-[#24150d] border-2 border-[#5c3a21] rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              {/* Player 1 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    mySymbol === 'X'
                      ? 'bg-gradient-to-br from-[#ffd700]/25 to-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700]'
                      : 'bg-gradient-to-br from-[#c0c0c0]/25 to-[#c0c0c0]/10 border border-[#c0c0c0]/30 text-[#c0c0c0]'
                  }`}>
                    {mySymbol}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-semibold text-[#d4a853] truncate">
                      {me?.name ?? 'You'}
                    </p>
                    {isMyTurn && (
                      <p className="text-[8px] sm:text-[9px] text-[#ffd700] uppercase tracking-wider font-bold">Your turn</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-center shrink-0 px-3 sm:px-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl font-black text-[#ffd700]">{room?.scores?.p1 ?? 0}</span>
                  <span className="text-[#5c3a21] text-lg font-light">:</span>
                  <span className="text-lg sm:text-xl font-black text-[#c0c0c0]">{room?.scores?.p2 ?? 0}</span>
                </div>
                <p className="text-[7px] sm:text-[8px] text-[#8b6508]/60 uppercase tracking-widest mt-0.5">Score</p>
                {showTurnTimer && room?.turnStartTime && (
                  <TurnTimer turnStartTime={room.turnStartTime} />
                )}
              </div>

              {/* Player 2 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-end">
                  <div className="min-w-0 text-right">
                    <p className="text-[11px] sm:text-xs font-semibold text-[#d4a853] truncate">
                      {opponent?.name ?? 'Waiting...'}
                    </p>
                    {isOppTurn && (
                      <p className="text-[8px] sm:text-[9px] text-[#c0c0c0] uppercase tracking-wider font-bold">Their turn</p>
                    )}
                  </div>
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    oppSymbol === 'X'
                      ? 'bg-gradient-to-br from-[#ffd700]/25 to-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700]'
                      : 'bg-gradient-to-br from-[#c0c0c0]/25 to-[#c0c0c0]/10 border border-[#c0c0c0]/30 text-[#c0c0c0]'
                  }`}>
                    {oppSymbol}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The Grid Board */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-[#6b4c1a] p-2.5 sm:p-3 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
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
