'use client'

import React from 'react'
import * as Icons from 'lucide-react'

interface AnimatedIconProps {
  name: keyof typeof Icons
  className?: string
  size?: number
  animation?: 'bounce' | 'spin' | 'pulse' | 'ping' | 'wiggle'
}

export function AnimatedIcon({
  name,
  className = '',
  size = 20,
  animation = 'pulse',
}: AnimatedIconProps) {
  const LucideIcon = (Icons[name] as React.ElementType) || Icons.HelpCircle

  let animClass = ''
  switch (animation) {
    case 'bounce':
      animClass = 'animate-bounce'
      break
    case 'spin':
      animClass = 'animate-spin'
      break
    case 'pulse':
      animClass = 'animate-pulse'
      break
    case 'ping':
      animClass = 'animate-ping'
      break
    case 'wiggle':
      animClass = 'hover:rotate-12 transition-transform duration-200'
      break
    default:
      animClass = ''
  }

  return (
    <span className={`inline-flex items-center justify-center ${animClass}`}>
      <LucideIcon className={className} size={size} />
    </span>
  )
}
