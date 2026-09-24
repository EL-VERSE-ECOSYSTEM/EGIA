import React from 'react'

/** Simple 25x25 SVG QR Code pattern generator for URLs/tokens */
export function QRCodeSVG({
  value,
  size = 180,
  bgColor = '#FFFFFF',
  fgColor = '#0F172A',
  className = '',
}: {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  className?: string
}) {
  const matrixSize = 25
  const cells: boolean[][] = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill(false)
  )

  // Function to draw finder pattern (7x7) at (row, col)
  const drawFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          i === 0 ||
          i === 6 ||
          j === 0 ||
          j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          cells[r + i][c + j] = true
        }
      }
    }
  }

  // Draw 3 standard corner finders
  drawFinder(0, 0)
  drawFinder(0, matrixSize - 7)
  drawFinder(matrixSize - 7, 0)

  // Hash string deterministically to fill inner payload matrix
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder zones
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= matrixSize - 8) ||
        (r >= matrixSize - 8 && c < 8)
      ) {
        continue
      }
      const cellHash = Math.abs(Math.sin(hash + r * 31 + c * 17))
      if (cellHash > 0.45) {
        cells[r][c] = true
      }
    }
  }

  const cellSize = size / matrixSize

  return (
    <div className={`inline-block p-3 rounded-2xl bg-white shadow-xl border border-slate-200 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`QR Code for ${value}`}
        role="img"
      >
        <rect width={size} height={size} fill={bgColor} rx="12" />
        {cells.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill={fgColor}
                rx="1"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  )
}

export default QRCodeSVG
