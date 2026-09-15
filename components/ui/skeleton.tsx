import React from 'react'

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-800/50 ${className}`}
      {...props}
    />
  )
}
