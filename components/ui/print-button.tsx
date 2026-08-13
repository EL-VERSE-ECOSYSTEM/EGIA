'use client'

import React from 'react'
import { Button } from './button'

export function PrintButton({
  label,
  className
}: {
  label: string
  className?: string
}) {
  return (
    <Button
      onClick={() => window.print()}
      size="sm"
      className={className}
    >
      {label}
    </Button>
  )
}
