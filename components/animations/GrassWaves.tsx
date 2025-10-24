'use client'

export function GrassWavesBackground() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 overflow-hidden">
      <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path
          d="M0,100 Q300,80 600,100 T1200,100 L1200,300 L0,300 Z"
          className="fill-grass-primary opacity-20 animate-wave-slow"
        />
        <path
          d="M0,120 Q300,100 600,120 T1200,120 L1200,300 L0,300 Z"
          className="fill-grass-secondary opacity-30 animate-wave-medium"
          style={{ fill: 'var(--grass-secondary)' }}
        />
        <path
          d="M0,140 Q300,120 600,140 T1200,140 L1200,300 L0,300 Z"
          className="fill-grass-accent opacity-40 animate-wave-fast"
          style={{ fill: 'var(--grass-accent)' }}
        />
      </svg>
    </div>
  )
}
