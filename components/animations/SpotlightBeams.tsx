'use client'

interface SpotlightBeamsProps {
  count?: number
}

export function SpotlightBeams({ count = 4 }: SpotlightBeamsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 w-32 h-full opacity-10 animate-spotlight"
          style={{
            left: `${(i / count) * 100}%`,
            background: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.8), transparent)',
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i}s`,
          }}
        />
      ))}
    </div>
  )
}
