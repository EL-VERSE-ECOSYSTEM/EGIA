'use client'

import { QRCodeSVG as QrCode } from 'qrcode.react'

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
  return (
    <div className={`inline-block rounded-2xl bg-white p-3 shadow-xl border border-slate-200 ${className}`}>
      <QrCode
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="M"
        marginSize={2}
        title={`QR code for ${value}`}
      />
    </div>
  )
}

export default QRCodeSVG
