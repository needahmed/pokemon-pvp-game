interface HealthBarProps {
  currentHp: number
  maxHp: number
  showText?: boolean
}

export default function HealthBar({ currentHp, maxHp, showText = false }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100))

  // Determine color based on health percentage
  let bgColor = "#22c55e" // Green
  if (percentage <= 20) {
    bgColor = "#ef4444" // Red
  } else if (percentage <= 50) {
    bgColor = "#f59e0b" // Yellow/Orange
  }

  return (
    <div className="w-full">
      {showText && (
        <div className="flex justify-between text-xs font-pokemon mb-1">
          <span>HP</span>
          <span>
            {currentHp}/{maxHp}
          </span>
        </div>
      )}
      <div className="h-4 bg-gray-200 border-2 border-gray-800 rounded-sm overflow-hidden relative">
        {/* HP text overlaid on the bar */}
        <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center">
          <span className="text-xs font-pokemon z-10 drop-shadow-sm text-black/80">
            HP
          </span>
        </div>
        
        {/* Actual HP bar with gradient */}
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: bgColor,
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5)'
          }}
        >
          {/* HP meter notches - classic Pokémon style */}
          <div className="h-full w-full" style={{ 
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)',
            backgroundSize: '4px 100%' 
          }}></div>
        </div>
      </div>
    </div>
  )
}
