'use client'
import { useEffect, useState } from 'react'

export function ConfettiEffect() {
  const [confetti, setConfetti] = useState<Array<{id: number, x: number, color: string}>>([])

  useEffect(() => {
    const pieces = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#FFD700', '#FF6347', '#4ECDC4', '#95E1D3', '#F38181'][Math.floor(Math.random() * 5)]
    }))
    setConfetti(pieces)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: '-10px',
            backgroundColor: piece.color,
            width: '10px',
            height: '10px',
            animationDuration: `${2 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.5}s`
          }}
        />
      ))}
    </div>
  )
}
