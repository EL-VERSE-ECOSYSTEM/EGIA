'use client'

import React, { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Trophy, Clock, RefreshCw, Star, HelpCircle, ChevronRight, Check, AlertCircle, Sparkles } from 'lucide-react'
import { checkStudentWeekendAssignmentsCompleteAction } from '@/app/actions/assessments'

// Game Types
type GameType = 'CHESS' | 'MATH' | 'SCRAMBLE' | 'SUDOKU' | 'TRIVIA' | 'SCRABBLE' | 'MONOPOLY' | 'HOME'

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
  const [assignmentLocked, setAssignmentLocked] = useState(false)
  const [assignmentInfo, setAssignmentInfo] = useState<{ completed: number; total: number } | null>(null)

  useEffect(() => {
    // Check if student has pending weekend assignments
    checkStudentWeekendAssignmentsCompleteAction('current')
      .then(res => {
        if (res && !res.isComplete) {
          setAssignmentLocked(true)
          setAssignmentInfo({ completed: res.completedCount, total: res.count })
        }
      })
      .catch(err => console.warn('Weekend assignment status check failed:', err))
  }, [])

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-6xl mx-auto space-y-10 min-h-screen bg-slate-50/20">
        {/* Header & Inter-School Friday League Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Gamepad2 size={240} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest">
              <Star size={12} className="fill-orange-400" /> EL LEARN App PLAY & LEARN
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Interactive Learning Arena</h1>
            <p className="text-slate-400 text-base md:text-lg font-medium max-w-2xl">
              Boost your intellectual thinking, strategic skills, and mental math capability through fun, engaging games designed for young leaders!
            </p>

            {/* Friday Inter-School Match Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border border-purple-500/40 text-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    BI-WEEKLY FRIDAY INTER-SCHOOL LEAGUE MATCHES
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 uppercase">ACTIVE TODAY</span>
                  </h4>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Students and pupils across all registered schools compete together on Friday every 2 weeks! Level difficulty automatically hardens per class.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {assignmentLocked && (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
              <div>
                <h3 className="font-black text-sm uppercase text-white">Weekend Assignments Pending</h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  You must complete your 3 weekend assignments before unlocking educational games ({assignmentInfo?.completed || 0}/{assignmentInfo?.total || 3} completed).
                </p>
              </div>
            </div>
            <a
              href="/dashboard/student/assessments/upcoming"
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-xl shadow shrink-0"
            >
              Complete Assignments
            </a>
          </div>
        )}

        {activeGame === 'HOME' && (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 ${assignmentLocked ? 'opacity-50 pointer-events-none' : ''}`}>
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

            {/* Scrabble Card */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between group">
              <div className="h-3 bg-red-600 w-full" />
              <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    📝
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Classic Scrabble</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Form words on a 15x15 board using letter tiles with point values! Build vocabulary, strategy, and spelling mastery against the Academy AI.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveGame('SCRABBLE')}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  PLAY SCRABBLE <ChevronRight size={14} className="ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Monopoly Card */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between group">
              <div className="h-3 bg-amber-600 w-full" />
              <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    🏦
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Academy Monopoly</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Buy, sell, and trade school properties! Collect rent, build classrooms, and bankrupt opponents in this educational twist on the classic property trading game.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveGame('MONOPOLY')}
                  className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs uppercase tracking-widest"
                >
                  PLAY MONOPOLY <ChevronRight size={14} className="ml-1" />
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

        {/* Scrabble Game */}
        {activeGame === 'SCRABBLE' && <ScrabbleGame onBack={() => setActiveGame('HOME')} />}

        {/* Monopoly Game */}
        {activeGame === 'MONOPOLY' && <MonopolyGame onBack={() => setActiveGame('HOME')} />}
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

  // Legal Chess Move Validation for all pieces
  const isValidChessMove = (sr: number, sc: number, tr: number, tc: number, piece: ChessPiece, target: ChessPiece, currentBoard: ChessBoardState) => {
    if (target.color === piece.color) return false
    const dr = tr - sr
    const dc = tc - sc
    const absDr = Math.abs(dr)
    const absDc = Math.abs(dc)

    switch (piece.type) {
      case 'p': {
        const direction = piece.color === 'w' ? -1 : 1
        const startRow = piece.color === 'w' ? 6 : 1
        // Standard 1-step forward
        if (dc === 0 && dr === direction && !target.type) return true
        // 2-step initial move
        if (dc === 0 && sr === startRow && dr === 2 * direction && !target.type && !currentBoard[sr + direction][sc].type) return true
        // Diagonal capture
        if (absDc === 1 && dr === direction && target.type && target.color !== piece.color) return true
        return false
      }
      case 'n': {
        return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2)
      }
      case 'b': {
        if (absDr !== absDc) return false
        const stepR = dr > 0 ? 1 : -1
        const stepC = dc > 0 ? 1 : -1
        let curR = sr + stepR
        let curC = sc + stepC
        while (curR !== tr && curC !== tc) {
          if (currentBoard[curR][curC].type) return false
          curR += stepR
          curC += stepC
        }
        return true
      }
      case 'r': {
        if (dr !== 0 && dc !== 0) return false
        const stepR = dr === 0 ? 0 : (dr > 0 ? 1 : -1)
        const stepC = dc === 0 ? 0 : (dc > 0 ? 1 : -1)
        let curR = sr + stepR
        let curC = sc + stepC
        while (curR !== tr || curC !== tc) {
          if (currentBoard[curR][curC].type) return false
          curR += stepR
          curC += stepC
        }
        return true
      }
      case 'q': {
        if (absDr === absDc) {
          const stepR = dr > 0 ? 1 : -1
          const stepC = dc > 0 ? 1 : -1
          let curR = sr + stepR
          let curC = sc + stepC
          while (curR !== tr && curC !== tc) {
            if (currentBoard[curR][curC].type) return false
            curR += stepR
            curC += stepC
          }
          return true
        } else if (dr === 0 || dc === 0) {
          const stepR = dr === 0 ? 0 : (dr > 0 ? 1 : -1)
          const stepC = dc === 0 ? 0 : (dc > 0 ? 1 : -1)
          let curR = sr + stepR
          let curC = sc + stepC
          while (curR !== tr || curC !== tc) {
            if (currentBoard[curR][curC].type) return false
            curR += stepR
            curC += stepC
          }
          return true
        }
        return false
      }
      case 'k': {
        return absDr <= 1 && absDc <= 1
      }
      default:
        return false
    }
  }

  const handleSquareClick = (r: number, c: number) => {
    if (winner) return

    const piece = board[r][c]

    if (selectedSquare) {
      const [sr, sc] = selectedSquare

      // Clicked same square or same color
      if (sr === r && sc === c) {
        setSelectedSquare(null)
        return
      }

      if (board[r][c].color === turn) {
        setSelectedSquare([r, c])
        return
      }

      const movingPiece = board[sr][sc]
      const targetPiece = board[r][c]

      // Validate Legal Move according to rules of chess
      if (!isValidChessMove(sr, sc, r, c, movingPiece, targetPiece, board)) {
        return
      }

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
  const [classLevel, setClassLevel] = useState<'P1_2' | 'P3_6' | 'JSS' | 'SSS'>('P3_6')
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'END'>('START')
  const [question, setQuestion] = useState({ expression: '', answer: 0 })
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [highScore, setHighScore] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateQuestion = () => {
    let expr = ''
    let ans = 0

    if (classLevel === 'P1_2') {
      // Primary 1-2: Simple addition / subtraction up to 20
      const op = Math.random() > 0.5 ? '+' : '−'
      if (op === '+') {
        const n1 = Math.floor(Math.random() * 10) + 1
        const n2 = Math.floor(Math.random() * 10) + 1
        expr = `${n1} + ${n2}`
        ans = n1 + n2
      } else {
        const n1 = Math.floor(Math.random() * 15) + 5
        const n2 = Math.floor(Math.random() * n1) + 1
        expr = `${n1} − ${n2}`
        ans = n1 - n2
      }
    } else if (classLevel === 'P3_6') {
      // Primary 3-6: Addition, Subtraction, Multiplication up to 50
      const ops = ['+', '−', '×']
      const op = ops[Math.floor(Math.random() * ops.length)]
      if (op === '+') {
        const n1 = Math.floor(Math.random() * 50) + 5
        const n2 = Math.floor(Math.random() * 50) + 5
        expr = `${n1} + ${n2}`
        ans = n1 + n2
      } else if (op === '−') {
        const n1 = Math.floor(Math.random() * 50) + 20
        const n2 = Math.floor(Math.random() * n1) + 1
        expr = `${n1} − ${n2}`
        ans = n1 - n2
      } else {
        const n1 = Math.floor(Math.random() * 12) + 2
        const n2 = Math.floor(Math.random() * 12) + 2
        expr = `${n1} × ${n2}`
        ans = n1 * n2
      }
    } else if (classLevel === 'JSS') {
      // JSS 1-3: Squares, Division, Multiplication up to 100
      const mode = Math.floor(Math.random() * 3)
      if (mode === 0) {
        const base = Math.floor(Math.random() * 15) + 2
        expr = `${base}²`
        ans = base * base
      } else if (mode === 1) {
        const divisor = Math.floor(Math.random() * 10) + 2
        ans = Math.floor(Math.random() * 12) + 2
        const dividend = divisor * ans
        expr = `${dividend} ÷ ${divisor}`
      } else {
        const n1 = Math.floor(Math.random() * 20) + 5
        const n2 = Math.floor(Math.random() * 15) + 3
        expr = `${n1} × ${n2}`
        ans = n1 * n2
      }
    } else {
      // SSS 1-3: Multi-term algebra and roots
      const mode = Math.floor(Math.random() * 3)
      if (mode === 0) {
        // e.g., 3x + 5 = 20 -> x = 5
        const xVal = Math.floor(Math.random() * 10) + 2
        const coeff = Math.floor(Math.random() * 5) + 2
        const constVal = Math.floor(Math.random() * 15) + 1
        const rightHand = coeff * xVal + constVal
        expr = `Solve x: ${coeff}x + ${constVal} = ${rightHand}`
        ans = xVal
      } else if (mode === 1) {
        const base = Math.floor(Math.random() * 15) + 3
        const sq = base * base
        expr = `√${sq}`
        ans = base
      } else {
        const n1 = Math.floor(Math.random() * 30) + 10
        const n2 = Math.floor(Math.random() * 20) + 5
        const n3 = Math.floor(Math.random() * 15) + 2
        expr = `${n1} + ${n2} × ${n3}`
        ans = n1 + n2 * n3
      }
    }

    setQuestion({ expression: expr, answer: ans })
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
              Select your class level for tailored difficulty, then solve equations in 30 seconds!
            </p>
          </div>

          {/* Class Difficulty Selector */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl font-black text-xs">
            <button
              onClick={() => setClassLevel('P1_2')}
              className={`px-4 py-2 rounded-xl transition ${classLevel === 'P1_2' ? 'bg-orange-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Primary 1 - 2
            </button>
            <button
              onClick={() => setClassLevel('P3_6')}
              className={`px-4 py-2 rounded-xl transition ${classLevel === 'P3_6' ? 'bg-orange-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Primary 3 - 6
            </button>
            <button
              onClick={() => setClassLevel('JSS')}
              className={`px-4 py-2 rounded-xl transition ${classLevel === 'JSS' ? 'bg-orange-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              JSS 1 - 3
            </button>
            <button
              onClick={() => setClassLevel('SSS')}
              className={`px-4 py-2 rounded-xl transition ${classLevel === 'SSS' ? 'bg-orange-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              SSS 1 - 3
            </button>
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

function ScrabbleGame({ onBack }: { onBack: () => void }) {
  const [word, setWord] = useState('')
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState('')
  const practiceWords = new Set([
    'ACADEMY', 'ALGEBRA', 'BIOLOGY', 'CHESS', 'CLASS', 'EARTH', 'ENERGY',
    'FRACTION', 'HISTORY', 'LEARN', 'MATH', 'PLANET', 'SCIENCE', 'SPELL',
    'STUDENT', 'TEACHER', 'WORD',
  ])
  const letterValues: Record<string, number> = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
  }

  const submitWord = () => {
    const normalized = word.trim().toUpperCase()
    if (!practiceWords.has(normalized)) {
      setMessage('That word is not in this practice dictionary. Try a displayed word such as SCIENCE or TEACHER.')
      return
    }
    setScore((current) => current + [...normalized].reduce((total, letter) => total + letterValues[letter], 0))
    setMessage(`${normalized} accepted! Points added.`)
    setWord('')
  }

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-red-600 font-black text-xs uppercase tracking-widest hover:underline mb-2 block">← BACK TO ARENA</button>
          <CardTitle className="text-3xl font-black text-slate-900">Word Tile Practice</CardTitle>
          <p className="text-slate-600 mt-2">Make a word from the practice list and score its letter values.</p>
        </div>
        <Badge className="h-fit bg-red-600 text-white">{score} points</Badge>
      </div>
      <div className="rounded-2xl bg-amber-50 p-5 text-amber-950">
        <p className="font-bold">Practice words: ACADEMY · ALGEBRA · BIOLOGY · FRACTION · HISTORY · PLANET · SCIENCE · STUDENT · TEACHER</p>
        <p className="text-sm mt-2">Practice mode only: this word exercise does not yet save scores or support live multiplayer.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input aria-label="Word to score" value={word} onChange={(event) => setWord(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitWord() }} placeholder="Type a practice word" className="max-w-sm" />
        <Button onClick={submitWord} disabled={!word.trim()} className="bg-red-600 hover:bg-red-700">Submit word</Button>
      </div>
      {message && <p aria-live="polite" className="text-sm font-semibold text-slate-700">{message}</p>}
    </Card>
  )
}

function MonopolyGame({ onBack }: { onBack: () => void }) {
  const spaces = [
    { name: 'Start', price: 0, rent: 0 },
    { name: 'Science Lab', price: 80, rent: 15 },
    { name: 'School Library', price: 100, rent: 20 },
    { name: 'Community Chest', price: 0, rent: 0 },
    { name: 'Sports Field', price: 120, rent: 25 },
    { name: 'School Cafe', price: 140, rent: 30 },
    { name: 'Quiz Challenge', price: 0, rent: 0 },
    { name: 'Art Studio', price: 160, rent: 35 },
  ]
  const [positions, setPositions] = useState([0, 0])
  const [cash, setCash] = useState([500, 500])
  const [owners, setOwners] = useState<number[]>(Array(spaces.length).fill(-1))
  const [turn, setTurn] = useState(0)
  const [message, setMessage] = useState('You go first. Roll the die to move.')
  const [finished, setFinished] = useState(false)

  const takeTurn = () => {
    if (finished) return
    const roll = Math.floor(Math.random() * 6) + 1
    const oldPosition = positions[turn]
    const newPosition = (oldPosition + roll) % spaces.length
    const nextPositions = [...positions]
    const nextCash = [...cash]
    const nextOwners = [...owners]
    let outcome = `${turn === 0 ? 'You' : 'Academy opponent'} rolled ${roll} and landed on ${spaces[newPosition].name}.`
    if (newPosition < oldPosition) {
      nextCash[turn] += 100
      outcome += ' Collected 100 for passing Start.'
    }
    const space = spaces[newPosition]
    if (space.price && nextOwners[newPosition] === -1 && nextCash[turn] >= space.price) {
      if (turn === 0) {
        nextCash[turn] -= space.price
        nextOwners[newPosition] = turn
        outcome += ` You bought it for ${space.price}.`
      } else if (Math.random() > 0.5) {
        nextCash[turn] -= space.price
        nextOwners[newPosition] = turn
        outcome += ` Academy bought it for ${space.price}.`
      } else {
        outcome += ' It remains available.'
      }
    } else if (space.price && nextOwners[newPosition] >= 0 && nextOwners[newPosition] !== turn) {
      const owner = nextOwners[newPosition]
      nextCash[turn] -= space.rent
      nextCash[owner] += space.rent
      outcome += ` Paid ${space.rent} rent.`
    } else if (space.name === 'Community Chest') {
      nextCash[turn] += 50
      outcome += ' Community Chest awarded 50.'
    } else if (space.name === 'Quiz Challenge') {
      nextCash[turn] += 25
      outcome += ' Correct quiz answer: earned 25.'
    }
    nextPositions[turn] = newPosition
    const bankrupt = nextCash[turn] <= 0
    setPositions(nextPositions)
    setCash(nextCash)
    setOwners(nextOwners)
    setMessage(outcome)
    setFinished(bankrupt)
    if (!bankrupt) setTurn((current) => 1 - current)
  }

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 space-y-6">
      <div>
        <button onClick={onBack} className="text-amber-700 font-black text-xs uppercase tracking-widest hover:underline mb-2 block">← BACK TO ARENA</button>
        <CardTitle className="text-3xl font-black text-slate-900">Academy Property Practice</CardTitle>
      </div>
      <p className="text-sm text-amber-950 bg-amber-50 rounded-2xl p-4">Practice mode against a local opponent; games and scores are not persisted or synchronized with other players.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {spaces.map((space, index) => <div key={space.name} className={`rounded-xl border p-4 ${positions.includes(index) ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
          <p className="font-bold text-slate-900">{space.name}</p>
          <p className="text-sm text-slate-600">{space.price ? `Price ${space.price} · Rent ${space.rent}` : 'Special space'}</p>
          {space.price > 0 && <p className="text-xs text-slate-500">{owners[index] < 0 ? 'Unowned' : owners[index] === 0 ? 'Owned by you' : 'Owned by Academy'}</p>}
        </div>)}
      </div>
      <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-800">
        <p>Your cash: {cash[0]} · Position: {spaces[positions[0]].name}</p>
        <p>Academy cash: {cash[1]} · Position: {spaces[positions[1]].name}</p>
      </div>
      <p aria-live="polite" className="text-sm text-slate-700">{message}</p>
      <Button onClick={takeTurn} disabled={finished || turn !== 0} className="bg-amber-600 hover:bg-amber-700">{finished ? 'Game over' : turn === 0 ? 'Roll your turn' : 'Academy is taking a turn…'}</Button>
      {!finished && turn === 1 && <AutoMonopolyTurn takeTurn={takeTurn} />}
    </Card>
  )
}

function AutoMonopolyTurn({ takeTurn }: { takeTurn: () => void }) {
  React.useEffect(() => {
    const timer = window.setTimeout(takeTurn, 700)
    return () => window.clearTimeout(timer)
  }, [takeTurn])
  return null
}
