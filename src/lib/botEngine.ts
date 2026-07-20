'use client'

type Difficulty = 'Easy' | 'Medium' | 'Epic'

const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function checkWin(board: string[]): { winner: string | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return { winner: null, line: null }
}

function getEmptyCells(board: string[]): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === '') acc.push(i)
    return acc
  }, [])
}

function minimax(
  board: string[],
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiSymbol: string,
  humanSymbol: string,
): number {
  const { winner } = checkWin(board)
  if (winner === aiSymbol) return 10
  if (winner === humanSymbol) return -10
  if (getEmptyCells(board).length === 0) return 0

  if (isMaximizing) {
    let best = -Infinity
    for (const i of getEmptyCells(board)) {
      board[i] = aiSymbol
      best = Math.max(best, minimax(board, false, alpha, beta, aiSymbol, humanSymbol))
      board[i] = ''
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const i of getEmptyCells(board)) {
      board[i] = humanSymbol
      best = Math.min(best, minimax(board, true, alpha, beta, aiSymbol, humanSymbol))
      board[i] = ''
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

export function getBotMove(board: string[], difficulty: Difficulty, botSymbol: string): number {
  const empty = getEmptyCells(board)
  if (empty.length === 0) return -1

  if (difficulty === 'Easy') {
    return getRandomMove(empty)
  }

  const humanSymbol = botSymbol === 'X' ? 'O' : 'X'
  const boardCopy = [...board]
  let bestScore = -Infinity
  let bestMove = empty[0]

  for (const i of empty) {
    boardCopy[i] = botSymbol
    const score = minimax(boardCopy, false, -Infinity, Infinity, botSymbol, humanSymbol)
    boardCopy[i] = ''
    if (score > bestScore) {
      bestScore = score
      bestMove = i
    }
  }

  if (difficulty === 'Medium') {
    if (Math.random() < 0.25) {
      return getRandomMove(empty)
    }
  }

  return bestMove
}

function getRandomMove(empty: number[]): number {
  return empty[Math.floor(Math.random() * empty.length)]
}

export function checkGameOver(board: string[]): { winner: string | null; line: number[] | null; tie: boolean } {
  const { winner, line } = checkWin(board)
  if (winner) return { winner, line, tie: false }
  const tie = board.every((cell) => cell !== '')
  return { winner: null, line: null, tie }
}
