import React from 'react'

export function SVGLoader({
  className = "w-12 h-12 text-orange-600",
  label = 'Loading',
  glow = true,
}: {
  className?: string
  label?: string
  glow?: boolean
}) {
  return (
    <div
      className="inline-flex items-center justify-center relative p-2"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {glow && (
        <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-pulse pointer-events-none" />
      )}
      <svg
        className={`relative ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {/* Background track circle */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="6"
          className="opacity-20"
        />
        {/* Primary rotating outer arc */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray="260"
          strokeDashoffset="180"
          strokeLinecap="round"
          className="animate-spin origin-center"
          style={{ animationDuration: '1.2s' }}
        />
        {/* Inner counter-rotating orbital ring */}
        <circle
          cx="50"
          cy="50"
          r="28"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="170"
          strokeDashoffset="120"
          strokeLinecap="round"
          className="animate-[spin_1.8s_linear_infinite_reverse] origin-center opacity-80"
        />
        {/* Glowing orbital center dot */}
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="currentColor"
          className="animate-pulse"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default SVGLoader
