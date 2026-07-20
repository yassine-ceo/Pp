'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBotMove, checkGameOver } from '@/lib/botEngine'
import { soundManager } from '@/lib/sound'

type Difficulty = 'Easy' | 'Medium' | 'Epic'

interface BotGameProps {
  difficulty: Difficulty
  playerName: string
  onBack: () => void
}

function GoldX() {
  return (
    <span className="font-black text-6xl sm:text-7xl select-none leading-none"
      style={{ color: '#ffd700', filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.8))' }}>
      X
    </span>
  )
}

function SilverO() {
  return (
    <span className="font-black text-6xl sm:text-7xl select-none leading-none"
      style={{ color: '#c0c0c0', filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.8))' }}>
      O
    </span>
  )
}

function Cell({ value, onClick, isWinCell, disabled }: {
  value: string
  onClick: () => void
  isWinCell: boolean
  disabled: boolean
}) {
  const canClick = value === '' && !disabled
  return (
    <button
      onClick={onClick}
      disabled={!canClick}
      className={`relative w-full aspect-square rounded-xl bg-[#1c1c1c] ${canClick ? 'cursor-pointer hover:bg-[#242424] active:scale-[0.96]' : 'cursor-default'} ${isWinCell ? 'ring-2 ring-[#daa520]/50' : ''} flex items-center justify-center`}
      style={{ boxShadow: isWinCell ? 'inset 0 4px 10px rgba(0,0,0,0.8), 0 0 15px rgba(218,165,32,0.15)' : 'inset 0 4px 10px rgba(0,0,0,0.8)' }}
    >
      {value === 'X' && <GoldX />}
      {value === 'O' && <SilverO />}
    </button>
  )
}

export default function BotGame({ difficulty, playerName, onBack }: BotGameProps) {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''))
  const [gameOver, setGameOver] = useState(false)
  const [result, setResult] = useState<{ winner: string | null; line: number[] | null; tie: boolean } | null>(null)
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [playerScore, setPlayerScore] = useState(0)
  const [botScore, setBotScore] = useState(0)

  const handleCellClick = useCallback((index: number) => {
    if (board[index] !== '' || gameOver || isBotThinking) return
    const newBoard = [...board]
    newBoard[index] = 'X'
    setBoard(newBoard)
    soundManager.playPlaceX?.()

    const state = checkGameOver(newBoard)
    if (state.winner || state.tie) {
      setGameOver(true)
      setResult(state)
      if (state.winner === 'X') setPlayerScore((s) => s + 1)
      else if (state.winner === 'O') setBotScore((s) => s + 1)
      return
    }

    setIsBotThinking(true)
  }, [board, gameOver, isBotThinking])

  useEffect(() => {
    if (!isBotThinking) return
    const timer = setTimeout(() => {
      setBoard((prev) => {
        const botIndex = getBotMove(prev, difficulty, 'O')
        if (botIndex === -1) return prev
        const next = [...prev]
        next[botIndex] = 'O'
        soundManager.playPlaceO?.()

        const state = checkGameOver(next)
        if (state.winner || state.tie) {
          setGameOver(true)
          setResult(state)
          if (state.winner === 'O') setBotScore((s) => s + 1)
        }

        return next
      })
      setIsBotThinking(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [isBotThinking, difficulty])

  const handleRestart = () => {
    setBoard(Array(9).fill(''))
    setGameOver(false)
    setResult(null)
    setIsBotThinking(false)
  }

  const playerActive = !gameOver && !isBotThinking
  const botActive = !gameOver && isBotThinking
  const winSet = new Set(result?.line ?? [])

  return (
    <main className="relative w-screen h-screen flex flex-col overflow-y-auto"
      style={{
        background: `
          radial-gradient(ellipse 140% 80% at 50% -20%, rgba(180,130,60,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 100% 60% at 80% 90%, rgba(180,130,60,0.06) 0%, transparent 50%),
          radial-gradient(ellipse 80% 60% at 20% 80%, rgba(180,130,60,0.04) 0%, transparent 40%),
          repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(255,215,0,0.015) 3px, rgba(255,215,0,0.015) 4px, transparent 4px, transparent 7px),
          repeating-linear-gradient(0deg, transparent 0px, transparent 60px, rgba(0,0,0,0.06) 60px, rgba(0,0,0,0.06) 61px, transparent 61px, transparent 120px),
          linear-gradient(180deg, #1a0f0a 0%, #0d0806 50%, #120a06 100%)
        `
      }}
    >
      {/* Warm ambient glow */}
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(180,130,60,0.07)' }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(200,160,80,0.05)' }} />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-105 active:scale-95"
        style={{ color: '#d4a84b', border: '1px solid rgba(212,168,75,0.25)', background: 'rgba(20,12,8,0.6)' }}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>

      {/* Difficulty badge */}
      <div className="absolute top-6 right-6 z-10 px-3 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-widest"
        style={{ background: 'rgba(212,168,75,0.1)', border: '1px solid rgba(212,168,75,0.2)', color: 'rgba(212,168,75,0.6)' }}>
        {difficulty}
      </div>

      {/* Board area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-[360px] mx-auto select-none pointer-events-auto">
          <div className="rounded-[2rem] overflow-hidden"
            style={{ background: '#1a1c20', boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)', border: '12px solid #8b6508' }}>
            {/* Header plaque */}
            <div className="relative rounded-2xl p-3 mb-4 mx-2 mt-2"
              style={{ background: 'linear-gradient(to bottom, #3a2318, #24150d)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)', border: '2px solid #5c3a21' }}>
              <div className="flex items-center justify-between gap-2">
                <div className={`flex-1 min-w-0 transition-opacity duration-200 ${playerActive ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2e2015, #1c140e)', border: '1.5px solid rgba(139,101,8,0.4)', color: '#e1c699', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      X
                    </div>
                    <p className="text-[11px] font-semibold text-[#c4a35a] truncate">{playerName}</p>
                  </div>
                </div>
                <div className="text-center shrink-0 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-[#c4a35a]">{playerScore}</span>
                    <span className="text-[#4a3520] text-sm font-light">:</span>
                    <span className="text-base font-black text-[#a0a0a0]">{botScore}</span>
                  </div>
                </div>
                <div className={`flex-1 min-w-0 transition-opacity duration-200 ${botActive ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-[11px] font-semibold text-[#c4a35a] truncate">Bot</p>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2e2015, #1c140e)', border: '1.5px solid rgba(139,101,8,0.4)', color: '#e1c699', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      O
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl p-3 mx-2 mb-2"
              style={{ background: '#6b4c1a', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)' }}>
              {board.map((cell, i) => (
                <Cell key={i} value={cell} onClick={() => handleCellClick(i)} isWinCell={winSet.has(i)} disabled={gameOver || isBotThinking} />
              ))}
            </div>
          </div>
          {/* Status text */}
          <p className="text-center text-xs mt-4 font-semibold" style={{ color: 'rgba(212,168,75,0.5)' }}>
            {gameOver ? 'Game Over' : isBotThinking ? 'Bot is thinking...' : 'Your turn'}
          </p>
        </div>
      </div>

      {/* Result overlay */}
      {result && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-auto" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-[1.5rem] overflow-hidden px-6 py-8 text-center max-w-xs w-full mx-4"
            style={{ background: 'linear-gradient(to bottom, #2b1d14, #1a120d)', boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)', border: '3px solid #3a2612' }}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(218,165,32,0.15), rgba(139,101,8,0.1))', border: '1.5px solid rgba(139,101,8,0.25)' }}>
              {result.tie ? (
                <span className="text-lg font-black" style={{ color: '#c4a35a' }}>─</span>
              ) : result.winner === 'X' ? (
                <span className="text-lg font-black" style={{ color: '#ffd700' }}>X</span>
              ) : (
                <span className="text-lg font-black" style={{ color: '#c0c0c0' }}>O</span>
              )}
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: '#c4a35a' }}>
              {result.tie ? "It's a Tie!" : result.winner === 'X' ? 'You Win!' : 'Bot Wins!'}
            </h2>
            <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {result.tie ? 'Well played!' : result.winner === 'X' ? `Great game against ${difficulty} bot!` : 'Better luck next time.'}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleRestart}
                className="w-full flex justify-center items-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                style={{ padding: '0.65rem 1.5rem', background: 'linear-gradient(to bottom, #2a1a10, #1a0f0a)', border: '1px solid rgba(212,168,75,0.35)', boxShadow: 'inset 0 1px 0 rgba(212,168,75,0.12), 0 2px 6px rgba(0,0,0,0.4)', color: '#d4a84b' }}>
                Play Again
              </button>
              <button onClick={onBack}
                className="w-full flex justify-center items-center gap-2 rounded-xl text-xs font-semibold transition-all"
                style={{ padding: '0.5rem 1.25rem', color: 'rgba(212,168,75,0.4)' }}>
                Change Difficulty
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
