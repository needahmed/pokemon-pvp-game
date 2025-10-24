'use client'

interface PortalVortexProps {
  centered?: boolean
}

export function PortalVortex({ centered = false }: PortalVortexProps) {
  return (
    <div className={`absolute ${centered ? 'inset-0 flex items-center justify-center' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}`}>
      <div className="relative w-96 h-96">
        {/* Multiple rotating rings */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute inset-0 border-2 rounded-full"
            style={{
              borderColor: `rgba(255, 20, 147, ${0.8 - i * 0.15})`,
              borderTopColor: 'transparent',
              animation: `spin ${3 + i}s linear infinite`,
              width: `${100 - i * 15}%`,
              height: `${100 - i * 15}%`,
              margin: 'auto',
              inset: 0,
            }}
          />
        ))}
        
        {/* Center glow */}
        <div className="absolute inset-0 m-auto w-32 h-32 bg-gradient-radial from-pink-500 via-purple-700 to-transparent rounded-full blur-2xl animate-pulse-slow" />
      </div>
    </div>
  )
}
