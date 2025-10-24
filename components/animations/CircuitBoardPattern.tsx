'use client'

export function CircuitBoardPattern() {
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10,10 L30,10 L30,30 L50,30" stroke="currentColor" strokeWidth="1" fill="none" className="text-cyan-400" />
            <circle cx="10" cy="10" r="2" fill="currentColor" className="text-cyan-400" />
            <circle cx="30" cy="30" r="2" fill="currentColor" className="text-green-400" />
            <circle cx="50" cy="30" r="2" fill="currentColor" className="text-blue-400" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>
    </div>
  )
}
