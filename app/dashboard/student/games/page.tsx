'use client'

import React, { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Trophy, Clock, RefreshCw, Star, HelpCircle, ChevronRight, Check, AlertCircle, Sparkles } from 'lucide-react'

// Game Types
type GameType = 'CHESS' | 'MATH' | 'SCRAMBLE' | 'SUDOKU' | 'TRIVIA' | 'HOME'

// Chess types
type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k' | ''
type PieceColor = 'w' | 'b' | ''
interface ChessPiece {
  type: PieceType
  color: PieceColor
}
type ChessBoardState = ChessPiece[][]

export default function StudentGamesPage() {
  const [activeGame, setActiveGame] = useState<GameType>('HOME')

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-6xl mx-auto space-y-10 min-h-screen bg-slate-50/20">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Gamepad2 size={240} />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest mb-6">
              <Star size={12} className="fill-orange-400" /> EL GOODNEWS PLAY & LEARN
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Interactive Learning Arena</h1>
            <p className="text-slate-400 text-lg font-medium max-w-2xl text-pretty">
              Boost your intellectual thinking, strategic skills, and mental math capability through fun, engaging games designed for young leaders!
            </p>
          </div>
        </div>

        {activeGame === 'HOME' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Chess Card */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between group">
              <div className="h-3 bg-purple-600 w-full" />
              <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    ♞
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Grandmaster Chess</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Learn the royal game of chess! Test your strategic skills, plan your moves, capture opponent pieces, and play against our adaptive Academy AI.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveGame('CHESS')}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  PLAY CHESS <ChevronRight size={14} className="ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Math Puzzle Card */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between group">
              <div className="h-3 bg-orange-600 w-full" />
              <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    +−
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Arithmetic Sprint</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Solve math equations rapidly against a ticking clock! Train your mental math accuracy across addition, subtraction, multiplication, and division.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveGame('MATH')}
                  className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  START SPEED MATH <ChevronRight size={14} className="ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Word Scramble Card */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between group">
              <div className="h-3 bg-emerald-600 w-full" />
              <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    A-Z
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Vocabulary Scramble</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Unscramble school-related letters to discover important science, mathematics, and literature keywords! Build spelling proficiency.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveGame('SCRAMBLE')}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  PLAY SCRAMBLE <ChevronRight size={14} className="ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Sudoku Challenge Card */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between group">
              <div className="h-3 bg-blue-600 w-full" />
              <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    🧩
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Sudoku Logic Puzzle</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Challenge your logical brain with the famous Sudoku! Arrange numbers 1 to 4 correctly so they never repeat in rows, columns, or grids.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveGame('SUDOKU')}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  PLAY SUDOKU <ChevronRight size={14} className="ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Subject Trivia Card */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between group">
              <div className="h-3 bg-pink-600 w-full" />
              <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-black text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    💡
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Subject Trivia Master</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Prove your knowledge! Answer rapid quizzes spanning Mathematics, Science, Literature, History, and Geography with detailed explanations!
                  </p>
                </div>
                <Button
                  onClick={() => setActiveGame('TRIVIA')}
                  className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  START TRIVIA <ChevronRight size={14} className="ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grandmaster Chess Game */}
        {activeGame === 'CHESS' && <ChessGame onBack={() => setActiveGame('HOME')} />}

        {/* Speed Math Challenge */}
        {activeGame === 'MATH' && <MathChallenge onBack={() => setActiveGame('HOME')} />}

        {/* Word Scramble Challenge */}
        {activeGame === 'SCRAMBLE' && <WordScramble onBack={() => setActiveGame('HOME')} />}

        {/* Sudoku Challenge */}
        {activeGame === 'SUDOKU' && <SudokuGame onBack={() => setActiveGame('HOME')} />}

        {/* Trivia Game */}
        {activeGame === 'TRIVIA' && <TriviaGame onBack={() => setActiveGame('HOME')} />}
      </div>
    </DashboardLayout>
  )
}

/* ====================================================================
   1. GRANDMASTER CHESS COMPONENT
   ==================================================================== */
function ChessGame({ onBack }: { onBack: () => void }) {
  const initialBoard = (): ChessBoardState => {
    const board: ChessBoardState = Array(8).fill(null).map(() => Array(8).fill({ type: '', color: '' }))

    // Set up major pieces
    const backRow = (color: PieceColor): ChessPiece[] => [
      { type: 'r', color }, { type: 'n', color }, { type: 'b', color }, { type: 'q', color },
      { type: 'k', color }, { type: 'b', color }, { type: 'n', color }, { type: 'r', color }
    ]

    board[0] = backRow('b')
    board[1] = Array(8).fill(null).map(() => ({ type: 'p', color: 'b' }))
    board[6] = Array(8).fill(null).map(() => ({ type: 'p', color: 'w' }))
    board[7] = backRow('w')

    return board
  }

  const [board, setBoard] = useState<ChessBoardState>(initialBoard())
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null)
  const [turn, setTurn] = useState<PieceColor>('w')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [score, setScore] = useState({ w: 0, b: 0 })
  const [winner, setWinner] = useState<string | null>(null)

  const getUnicodeChar = (p: ChessPiece) => {
    if (!p.type) return ''
    const chars: Record<string, Record<string, string>> = {
      w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
      b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
    }
    const colorMap = chars[p.color]
    return colorMap ? (colorMap[p.type] || '') : ''
  }

  const handleSquareClick = (r: number, c: number) => {
    if (winner) return

    const piece = board[r][c]

    if (selectedSquare) {
      const [sr, sc] = selectedSquare

      // Clicked the same square or same color - deselect or reselect
      if (sr === r && sc === c) {
        setSelectedSquare(null)
        return
      }

      if (board[r][c].color === turn) {
        setSelectedSquare([r, c])
        return
      }

      // Perform Move
      const movingPiece = board[sr][sc]
      const targetPiece = board[r][c]

      const newBoard = board.map(row => [...row])
      newBoard[r][c] = movingPiece
      newBoard[sr][sc] = { type: '', color: '' }

      // Keep score on captures
      if (targetPiece.type) {
        const pointsMap: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100, '': 0 }
        const points = pointsMap[targetPiece.type]
        if (turn === 'w') {
          setScore(prev => ({ ...prev, w: prev.w + points }))
        } else {
          setScore(prev => ({ ...prev, b: prev.b + points }))
        }

        if (targetPiece.type === 'k') {
          setWinner(turn === 'w' ? 'White (Player)' : 'Black (AI)')
        }
      }

      const moveNotation = `${movingPiece.type.toUpperCase()}${String.fromCharCode(97 + sc)}${8 - sr} ➜ ${String.fromCharCode(97 + c)}${8 - r}`
      setMoveHistory(prev => [moveNotation, ...prev])

      setBoard(newBoard)
      setSelectedSquare(null)
      setTurn('b') // Turn to AI opponent
    } else {
      if (piece.color === turn) {
        setSelectedSquare([r, c])
      }
    }
  }

  // Very smart defensive & capture-focused AI opponent logic
  useEffect(() => {
    if (turn === 'b' && !winner) {
      const timer = setTimeout(() => {
        // Collect all possible valid moves for black
        const blackMoves: { from: [number, number], to: [number, number], score: number }[] = []

        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (board[r][c].color === 'b') {
              // Basic move calculations depending on piece
              const pieceType = board[r][c].type

              // Pawn moves
              if (pieceType === 'p') {
                if (r + 1 < 8 && !board[r + 1][c].type) {
                  blackMoves.push({ from: [r, c], to: [r + 1, c], score: 1 })
                }
                // Diagonal captures
                if (r + 1 < 8 && c - 1 >= 0 && board[r + 1][c - 1].color === 'w') {
                  blackMoves.push({ from: [r, c], to: [r + 1, c - 1], score: 10 })
                }
                if (r + 1 < 8 && c + 1 < 8 && board[r + 1][c + 1].color === 'w') {
                  blackMoves.push({ from: [r, c], to: [r + 1, c + 1], score: 10 })
                }
              }

              // Knight / Bishop / Rook / Queen / King generic random adjacent exploration
              const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]
              offsets.forEach(([dr, dc]) => {
                const tr = r + dr
                const tc = c + dc
                if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                  const target = board[tr][tc]
                  if (target.color !== 'b') {
                    const targetScore = target.type ? 15 : 2 // heavily value captures
                    blackMoves.push({ from: [r, c], to: [tr, tc], score: targetScore })
                  }
                }
              })
            }
          }
        }

        if (blackMoves.length > 0) {
          // Sort by highest score (captures first!)
          blackMoves.sort((x, y) => y.score - x.score)
          const chosen = blackMoves[0] // pick the best move!

          const [sr, sc] = chosen.from
          const [r, c] = chosen.to

          const movingPiece = board[sr][sc]
          const targetPiece = board[r][c]

          const newBoard = board.map(row => [...row])
          newBoard[r][c] = movingPiece
          newBoard[sr][sc] = { type: '', color: '' }

          if (targetPiece.type) {
            const pointsMap: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100, '': 0 }
            setScore(prev => ({ ...prev, b: prev.b + pointsMap[targetPiece.type] }))

            if (targetPiece.type === 'k') {
              setWinner('Black (AI)')
            }
          }

          const moveNotation = `${movingPiece.type.toUpperCase()}${String.fromCharCode(97 + sc)}${8 - sr} ➜ ${String.fromCharCode(97 + c)}${8 - r}`
          setMoveHistory(prev => [`AI: ${moveNotation}`, ...prev])

          setBoard(newBoard)
          setTurn('w')
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [turn, board, winner])

  const resetGame = () => {
    setBoard(initialBoard())
    setSelectedSquare(null)
    setTurn('w')
    setMoveHistory([])
    setScore({ w: 0, b: 0 })
    setWinner(null)
  }

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <button onClick={onBack} className="text-purple-600 font-black text-xs uppercase tracking-widest hover:underline mb-2 block">
            ← BACK TO ARENA
          </button>
          <CardTitle className="text-3xl font-black text-slate-900">Grandmaster Chess ♞</CardTitle>
          <p className="text-slate-400 font-bold text-xs mt-0.5">Test your tactics against the Academy AI. Capturing the King wins!</p>
        </div>
        <Button onClick={resetGame} variant="outline" className="border-2 border-purple-100 text-purple-600 font-black rounded-xl">
          <RefreshCw size={14} className="mr-1.5" /> RESTART
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chessboard */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="border-[12px] border-slate-950 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
            {board.map((row, rIdx) => (
              <div key={rIdx} className="flex">
                {row.map((piece, cIdx) => {
                  const isLight = (rIdx + cIdx) % 2 === 0
                  const isSelected = selectedSquare && selectedSquare[0] === rIdx && selectedSquare[1] === cIdx

                  return (
                    <div
                      key={cIdx}
                      onClick={() => handleSquareClick(rIdx, cIdx)}
                      className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-4xl cursor-pointer select-none transition-all duration-200
                        ${isLight ? 'bg-[#F0D9B5]' : 'bg-[#B58863]'}
                        ${isSelected ? 'ring-4 ring-purple-600 ring-inset scale-95 z-10' : ''}
                        hover:opacity-90
                      `}
                    >
                      <span className={`transform transition-transform hover:scale-110 duration-200 ${piece.color === 'w' ? 'text-slate-900 font-normal drop-shadow-md' : 'text-slate-950 drop-shadow-sm'}`}>
                        {getUnicodeChar(piece)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="flex gap-10 mt-6 font-black text-sm uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-slate-900 rounded-full"></span> White Score: <span className="text-purple-600">{score.w}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-purple-600 rounded-full"></span> Black (AI): <span className="text-purple-600">{score.b}</span>
            </span>
          </div>
        </div>

        {/* Game Stats & History */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
            <h4 className="font-black text-xs uppercase text-slate-400 tracking-wider">Game Status</h4>
            {winner ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm font-black flex items-center gap-2">
                🏆 WINNER: {winner}!
              </div>
            ) : (
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-purple-800 text-sm font-black flex items-center gap-2">
                🎮 TURN: {turn === 'w' ? 'White (You)' : 'Black (AI Thinking...)'}
              </div>
            )}

            <div className="space-y-2">
              <p className="font-black text-xs uppercase text-slate-400 tracking-wider mt-4">Move Log</p>
              <div className="h-44 overflow-y-auto border border-slate-100 bg-white rounded-2xl p-4 font-mono text-xs space-y-1 text-slate-500">
                {moveHistory.length === 0 ? (
                  <p className="italic text-slate-300">No moves made yet.</p>
                ) : (
                  moveHistory.map((h, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-50 py-1">
                      <span>{moveHistory.length - i}.</span>
                      <span className="font-bold text-slate-700">{h}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-purple-50/50 rounded-3xl border border-purple-100 flex gap-4">
            <HelpCircle className="text-purple-600 shrink-0 w-6 h-6" />
            <div>
              <p className="font-black text-purple-950 text-xs uppercase tracking-wider">Quick Rules</p>
              <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                Click a piece of your color to select it. Click a valid tile or enemy piece to move/capture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ====================================================================
   2. SPEED MATH ARITHMETIC CHALLENGE
   ==================================================================== */
function MathChallenge({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'END'>('START')
  const [question, setQuestion] = useState({ expression: '', answer: 0 })
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [highScore, setHighScore] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateQuestion = () => {
    const operators = ['+', '−', '×']
    const op = operators[Math.floor(Math.random() * operators.length)]
    let num1 = 0, num2 = 0, ans = 0

    if (op === '+') {
      num1 = Math.floor(Math.random() * 50) + 1
      num2 = Math.floor(Math.random() * 50) + 1
      ans = num1 + num2
    } else if (op === '−') {
      num1 = Math.floor(Math.random() * 50) + 10
      num2 = Math.floor(Math.random() * num1) + 1
      ans = num1 - num2
    } else {
      num1 = Math.floor(Math.random() * 12) + 2
      num2 = Math.floor(Math.random() * 12) + 2
      ans = num1 * num2
    }

    setQuestion({ expression: `${num1} ${op} ${num2}`, answer: ans })
    setUserInput('')
  }

  const startGame = () => {
    setScore(0)
    setTimeLeft(30)
    setGameState('PLAYING')
    generateQuestion()
  }

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (parseInt(userInput.trim()) === question.answer) {
      setScore(prev => prev + 10)
      generateQuestion()
    } else {
      alert(`Oops! Wrong answer. Correct was ${question.answer}`)
      generateQuestion()
    }
  }

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setGameState('END')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
    }
  }, [score, highScore])

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <button onClick={onBack} className="text-orange-600 font-black text-xs uppercase tracking-widest hover:underline mb-2 block">
            ← BACK TO ARENA
          </button>
          <CardTitle className="text-3xl font-black text-slate-900">Arithmetic Speed Sprint +−</CardTitle>
          <p className="text-slate-400 font-bold text-xs mt-0.5">Solve as many simple equations as possible in 30 seconds!</p>
        </div>
      </div>

      {gameState === 'START' && (
        <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-95">
          <div className="w-24 h-24 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-4xl">
            ⏱
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">Are you ready to race?</h3>
            <p className="text-slate-400 text-sm font-semibold max-w-sm mx-auto mt-2">
              Each correct answer awards 10 points. Wrong answers don't penalize, but cost precious seconds!
            </p>
          </div>
          <Button onClick={startGame} className="bg-orange-600 hover:bg-orange-700 text-white font-black text-sm h-14 px-10 rounded-2xl shadow-xl shadow-orange-100">
            START CHALLENGE
          </Button>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8 flex flex-col items-center justify-center py-6 bg-slate-50 border border-slate-100 rounded-3xl">
            <div className="text-6xl font-black text-slate-900 font-mono tracking-tight">
              {question.expression} = ?
            </div>

            <form onSubmit={handleAnswerSubmit} className="flex gap-4 w-full max-w-md px-6">
              <Input
                type="number"
                placeholder="Type answer..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                autoFocus
                className="h-16 rounded-2xl text-xl font-black text-center focus:ring-orange-600 border-2"
              />
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 h-16 px-8 rounded-2xl font-black uppercase text-xs tracking-wider">
                SUBMIT
              </Button>
            </form>
          </div>

          <div className="space-y-6 p-6 bg-orange-50/50 border border-orange-100 rounded-3xl">
            <div className="flex justify-between items-center pb-4 border-b border-orange-100">
              <span className="text-xs font-black uppercase text-orange-800 tracking-wider">Time Left</span>
              <Badge className="bg-orange-600 text-white font-mono text-lg font-black px-4 py-1 flex items-center gap-1.5 rounded-xl">
                <Clock size={16} /> {timeLeft}s
              </Badge>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-orange-100">
              <span className="text-xs font-black uppercase text-orange-800 tracking-wider">My Score</span>
              <span className="text-3xl font-black text-slate-900">{score}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-orange-800 tracking-wider">Personal Best</span>
              <span className="text-xl font-black text-slate-700">{highScore}</span>
            </div>
          </div>
        </div>
      )}

      {gameState === 'END' && (
        <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
          <Trophy size={64} className="text-orange-500 fill-orange-100 animate-bounce" />
          <div>
            <h3 className="text-3xl font-black text-slate-900">Sprint Finished!</h3>
            <p className="text-lg font-bold text-slate-500 mt-2">
              You scored <span className="text-orange-600 font-black text-xl">{score}</span> points.
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={startGame} className="bg-orange-600 hover:bg-orange-700 text-white font-black h-12 px-8 rounded-xl shadow-lg">
              PLAY AGAIN
            </Button>
            <Button onClick={onBack} variant="outline" className="border-2 font-black h-12 px-8 rounded-xl">
              BACK TO ARENA
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ====================================================================
   3. VOCABULARY WORD SCRAMBLE
   ==================================================================== */
function WordScramble({ onBack }: { onBack: () => void }) {
  const words = [
    { original: 'ALGEBRA', hint: 'A branch of mathematics using letters and symbols.' },
    { original: 'GEOMETRY', hint: 'The study of points, lines, shapes, and angles.' },
    { original: 'PHOTOSYNTHESIS', hint: 'The process plants use to make food from sunlight.' },
    { original: 'NUCLEUS', hint: 'The center brain of an atom or living cell.' },
    { original: 'GRAVITY', hint: 'The natural force that pulls objects down to the ground.' },
    { original: 'CIVICS', hint: 'The study of citizenship, rights, and government.' },
    { original: 'LITERATURE', hint: 'Written works, novels, and stories of artistic value.' }
  ]

  const [wordIndex, setWordIndex] = useState(0)
  const [scrambled, setScrambled] = useState('')
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | 'PENDING'>('PENDING')
  const [score, setScore] = useState(0)

  const scrambleWord = (word: string) => {
    const arr = word.split('')
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }
    // Make sure scrambled is not equal to original
    const result = arr.join('')
    if (result === word) {
      return scrambleWord(word)
    }
    return result
  }

  const loadWord = (idx: number) => {
    setWordIndex(idx)
    setScrambled(scrambleWord(words[idx].original))
    setUserInput('')
    setFeedback('PENDING')
  }

  useEffect(() => {
    loadWord(0)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = userInput.trim().toUpperCase()
    if (input === words[wordIndex].original) {
      setFeedback('CORRECT')
      setScore(prev => prev + 20)
    } else {
      setFeedback('WRONG')
    }
  }

  const handleNext = () => {
    const nextIdx = (wordIndex + 1) % words.length
    loadWord(nextIdx)
  }

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <button onClick={onBack} className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline mb-2 block">
            ← BACK TO ARENA
          </button>
          <CardTitle className="text-3xl font-black text-slate-900">Vocabulary Scramble A-Z</CardTitle>
          <p className="text-slate-400 font-bold text-xs mt-0.5">Unscramble the letters to reveal important vocabulary terms!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8 flex flex-col items-center justify-center py-10 bg-slate-50 border border-slate-100 rounded-3xl">
          {/* Letters Scrambled Bubble */}
          <div className="flex gap-2 flex-wrap justify-center px-4">
            {scrambled.split('').map((char, idx) => (
              <div key={idx} className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-lg transform rotate-2">
                {char}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-4 w-full max-w-md px-6">
            <Input
              placeholder="Your answer..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={feedback === 'CORRECT'}
              className="h-14 rounded-xl text-lg font-black text-center uppercase focus:ring-emerald-600"
            />
            <Button
              type="submit"
              disabled={feedback === 'CORRECT' || !userInput}
              className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 rounded-xl font-black text-xs uppercase tracking-widest"
            >
              VERIFY
            </Button>
          </form>

          {feedback === 'CORRECT' && (
            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center text-center space-y-3 w-full max-w-md animate-in zoom-in-95">
              <Check className="text-emerald-600 w-8 h-8" />
              <div>
                <p className="font-black text-emerald-950">Awesome Work! Correct!</p>
                <p className="text-xs text-emerald-700 font-bold mt-1">You discovered the word and earned +20 Points!</p>
              </div>
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 h-10 px-6 rounded-lg font-black text-xs">
                NEXT WORD
              </Button>
            </div>
          )}

          {feedback === 'WRONG' && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 w-full max-w-md animate-in slide-in-from-bottom-2">
              <AlertCircle className="text-red-600 shrink-0" />
              <div>
                <p className="font-black text-red-950 text-sm">That's not correct.</p>
                <p className="text-xs text-red-600 font-bold">Try rearranging the letters or checking the hint panel.</p>
              </div>
            </div>
          )}
        </div>

        {/* Hints and Score */}
        <div className="space-y-6">
          <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl space-y-4">
            <h4 className="font-black text-xs uppercase text-emerald-800 tracking-wider">Word Hint</h4>
            <p className="text-slate-700 font-semibold leading-relaxed text-sm">
              "{words[wordIndex].hint}"
            </p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">My Total Points</span>
            <Badge className="bg-emerald-600 text-white font-black text-base px-4 py-1.5 rounded-xl">
              {score} PTS
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ====================================================================
   4. SUDOKU LOGIC PUZZLE (4x4)
   ==================================================================== */
function SudokuGame({ onBack }: { onBack: () => void }) {
  // A standard valid 4x4 Sudoku template
  // Rows:
  // [1, 2, 3, 4]
  // [3, 4, 1, 2]
  // [2, 3, 4, 1]
  // [4, 1, 2, 3]
  const solution = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 3, 4, 1],
    [4, 1, 2, 3]
  ]

  // Mask some elements to create a playable puzzle
  const initialGrid = [
    [1, 0, 3, 0],
    [0, 4, 0, 2],
    [2, 0, 4, 0],
    [0, 1, 0, 3]
  ]

  const [grid, setGrid] = useState<number[][]>(initialGrid.map(row => [...row]))
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState<'PLAYING' | 'SOLVED' | 'INVALID'>('PLAYING')

  const handleChange = (r: number, c: number, val: string) => {
    if (initialGrid[r][c] !== 0) return // locked cells
    const num = parseInt(val)
    const newGrid = grid.map(row => [...row])
    if (isNaN(num) || num < 1 || num > 4) {
      newGrid[r][c] = 0
    } else {
      newGrid[r][c] = num
    }
    setGrid(newGrid)
    setStatus('PLAYING')
  }

  const checkSolution = () => {
    let matches = true
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] !== solution[r][c]) {
          matches = false
        }
      }
    }

    if (matches) {
      setStatus('SOLVED')
      setScore(prev => prev + 50)
      alert('Congratulations! Correctly Solved! +50 Points')
    } else {
      setStatus('INVALID')
      alert('Some numbers are repeating or placed incorrectly according to Sudoku logic. Look closely and try again!')
    }
  }

  const showSolution = () => {
    setGrid(solution.map(row => [...row]))
    setStatus('SOLVED')
  }

  const resetGame = () => {
    setGrid(initialGrid.map(row => [...row]))
    setStatus('PLAYING')
  }

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <button onClick={onBack} className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline mb-2 block">
            ← BACK TO ARENA
          </button>
          <CardTitle className="text-3xl font-black text-slate-900">4x4 Sudoku Logic Puzzle 🧩</CardTitle>
          <p className="text-slate-400 font-bold text-xs mt-0.5">Arrange numbers 1-4. No repeating values in rows, columns, or 2x2 grids!</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetGame} variant="outline" className="border-2 border-blue-100 text-blue-600 font-black rounded-xl text-xs h-10">
            <RefreshCw size={12} className="mr-1" /> RESET
          </Button>
          <Button onClick={showSolution} variant="ghost" className="text-slate-500 font-black hover:bg-slate-100 rounded-xl text-xs h-10">
            SOLVE
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="grid grid-cols-2 gap-1 bg-slate-300 p-1 rounded-2xl border-4 border-slate-900">
            {/* 2x2 Quadrant groupings */}
            {[0, 1].map((quadRow) => (
              <div key={quadRow} className="grid grid-cols-2 gap-1">
                {[0, 1].map((quadCol) => {
                  const startRow = quadRow * 2
                  const startCol = quadCol * 2
                  return (
                    <div key={quadCol} className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg">
                      {[0, 1].map((rOffset) => {
                        const r = startRow + rOffset
                        return [0, 1].map((cOffset) => {
                          const c = startCol + cOffset
                          const isLocked = initialGrid[r][c] !== 0
                          const cellVal = grid[r][c]
                          return (
                            <input
                              key={`${r}-${c}`}
                              type="text"
                              maxLength={1}
                              disabled={isLocked}
                              value={cellVal === 0 ? '' : cellVal}
                              onChange={(e) => handleChange(r, c, e.target.value)}
                              className={`w-14 h-14 text-2xl font-black text-center rounded-xl focus:ring-4 focus:ring-blue-600 border border-slate-200 outline-none transition-all
                                ${isLocked ? 'bg-slate-100 text-slate-800 border-none' : 'text-blue-600 bg-white font-mono'}
                              `}
                            />
                          )
                        })
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <Button
            onClick={checkSolution}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black h-12 px-8 rounded-xl mt-6 tracking-wider shadow-lg shadow-blue-100"
          >
            VERIFY MY PUZZLE
          </Button>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-4">
            <h4 className="font-black text-xs uppercase text-blue-800 tracking-wider">How to Play</h4>
            <p className="text-slate-700 font-semibold leading-relaxed text-xs">
              1. Cells pre-filled with dark letters are locked.
              <br />
              2. Type any number 1 to 4 into the white cells.
              <br />
              3. Check solution when fully filled!
            </p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Puzzles Solved</span>
            <Badge className="bg-blue-600 text-white font-black text-base px-4 py-1.5 rounded-xl">
              {score} PTS
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ====================================================================
   5. SUBJECT TRIVIA QUIZ MASTER
   ==================================================================== */
function TriviaGame({ onBack }: { onBack: () => void }) {
  const quizQuestions = [
    {
      q: 'Which of the following is the standard unit of force?',
      options: ['Watt', 'Joule', 'Newton', 'Pascal'],
      answer: 'Newton',
      explanation: 'Newton (N) is the SI unit of force named in honor of Sir Isaac Newton and his works on gravitational laws.'
    },
    {
      q: 'Solve for x: 3x + 12 = 27',
      options: ['x = 3', 'x = 5', 'x = 7', 'x = 9'],
      answer: 'x = 5',
      explanation: 'Subtract 12 from both sides: 3x = 15. Divide by 3: x = 5.'
    },
    {
      q: 'What gas do plants absorb from the air to facilitate photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
      answer: 'Carbon Dioxide',
      explanation: 'Plants absorb Carbon Dioxide (CO2) from the air to build glucose during standard dark/light cycle photosynthesis.'
    },
    {
      q: 'Who was the first president of Nigeria?',
      options: ['Nnamdi Azikiwe', 'Obafemi Awolowo', 'Tafawa Balewa', 'Ahmadu Bello'],
      answer: 'Nnamdi Azikiwe',
      explanation: 'Dr. Nnamdi Azikiwe became the first ceremonial President of Nigeria on November 16, 1963.'
    }
  ]

  const [qIdx, setQIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)

  const handleOptionSelect = (opt: string) => {
    if (showAnswer) return
    setSelectedOption(opt)
  }

  const handleVerify = () => {
    if (!selectedOption) return
    setShowAnswer(true)
    if (selectedOption === quizQuestions[qIdx].answer) {
      setScore(prev => prev + 25)
    }
  }

  const handleNext = () => {
    setSelectedOption(null)
    setShowAnswer(false)
    setQIdx(prev => (prev + 1) % quizQuestions.length)
  }

  const current = quizQuestions[qIdx]

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <button onClick={onBack} className="text-pink-600 font-black text-xs uppercase tracking-widest hover:underline mb-2 block">
            ← BACK TO ARENA
          </button>
          <CardTitle className="text-3xl font-black text-slate-900">Subject Trivia Master 💡</CardTitle>
          <p className="text-slate-400 font-bold text-xs mt-0.5">Answer core academic questions correctly to build elite scholarship skills!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8 flex flex-col items-start py-8 px-10 bg-slate-50 border border-slate-100 rounded-3xl">
          <div className="text-xs font-black uppercase text-pink-600 tracking-widest">
            Question {qIdx + 1} of {quizQuestions.length}
          </div>
          <div className="text-2xl font-black text-slate-900 leading-snug">
            {current.q}
          </div>

          <div className="w-full space-y-3">
            {current.options.map((opt) => {
              const isSelected = selectedOption === opt
              const isCorrect = opt === current.answer

              let styleClass = 'border-slate-100 bg-white hover:border-pink-200'
              if (isSelected) styleClass = 'border-pink-600 bg-pink-50'
              if (showAnswer && isCorrect) styleClass = 'border-emerald-500 bg-emerald-50 text-emerald-800'
              if (showAnswer && isSelected && !isCorrect) styleClass = 'border-red-500 bg-red-50 text-red-800'

              return (
                <div
                  key={opt}
                  onClick={() => handleOptionSelect(opt)}
                  className={`p-5 rounded-2xl border-2 font-black text-sm cursor-pointer transition-all flex items-center justify-between ${styleClass}`}
                >
                  <span>{opt}</span>
                  {showAnswer && isCorrect && <Check size={18} className="text-emerald-600 shrink-0" />}
                </div>
              )
            })}
          </div>

          {!showAnswer ? (
            <Button
              onClick={handleVerify}
              disabled={!selectedOption}
              className="bg-pink-600 hover:bg-pink-700 text-white font-black h-12 px-8 rounded-xl shadow-lg shadow-pink-100"
            >
              SUBMIT & VERIFY
            </Button>
          ) : (
            <Button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 text-white font-black h-12 px-8 rounded-xl shadow-lg">
              NEXT QUESTION
            </Button>
          )}

          {showAnswer && (
            <div className="p-6 bg-pink-50/50 border border-pink-100 rounded-2xl w-full animate-in slide-in-from-bottom-2 space-y-2">
              <p className="text-xs font-black uppercase text-pink-600 tracking-wider">Academic Explanation</p>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                {current.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-pink-50 border border-pink-100 rounded-3xl space-y-2 text-center">
            <Trophy size={48} className="text-pink-600 mx-auto animate-pulse" />
            <h4 className="font-black text-xs uppercase text-pink-800 tracking-wider mt-2">Scholar Score</h4>
            <p className="text-3xl font-black text-slate-900">{score} PTS</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
