'use client'
import { THEME as T } from '@/lib/utils'

interface QRCodeProps {
  value: string
  size?: number
  color?: string
  bg?: string
}

export function QRCode({ value, size = 80, color = T.gold, bg = 'transparent' }: QRCodeProps) {
  const hash = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const N = 21
  const cs = size / N

  const FIXED = new Set([
    ...[0, 1, 2, 3, 4, 5, 6].flatMap((i) =>
      [[0,i],[6,i],[i,0],[i,6],[0,14+i],[6,14+i],[i,14],[i,20],[14+i,0],[14+i,6],[14,i],[20,i]].map(([r,c]) => `${r},${c}`)
    ),
    ...[2, 3, 4].flatMap((r) => [2, 3, 4].flatMap((c) => [`${r},${c}`, `${r},${16+c-2}`, `${14+r},${c}`])),
  ])

  const cells: React.ReactElement[] = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const filled = FIXED.has(`${r},${c}`) || (((hash * (r * N + c + 1) * 2654435761) >>> 0) % 3 === 0)
      if (filled) {
        cells.push(<rect key={`${r}-${c}`} x={c * cs} y={r * cs} width={cs} height={cs} fill={color} />)
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {bg !== 'transparent' && <rect width={size} height={size} fill={bg} />}
      {cells}
    </svg>
  )
}
