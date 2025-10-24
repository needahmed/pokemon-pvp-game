'use client'

export function LightningBolts({ count = 10 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="absolute animate-lightning"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '2px',
            height: '100px',
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${0.1 + Math.random() * 0.2}s`
          }}
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="100"
            stroke="url(#lightning-gradient)"
            strokeWidth="2"
            filter="url(#glow)"
          />
          <defs>
            <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFF00" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>
      ))}
    </div>
  )
}
