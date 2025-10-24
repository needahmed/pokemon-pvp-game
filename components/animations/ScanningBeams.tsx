'use client'

export function ScanningBeams() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-lg shadow-cyan-400 animate-scan-down"></div>
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-400 shadow-lg shadow-green-400 animate-scan-right"></div>
    </div>
  )
}
