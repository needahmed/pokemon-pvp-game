'use client'
import { useEffect, useState } from 'react'

interface Ripple {
  x: number
  y: number
  id: number
}

export function WaterRipples() {
  const [ripples, setRipples] = useState<Ripple[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      const newRipple = {
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
        id: Date.now()
      }
      setRipples(prev => [...prev, newRipple].slice(-10))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute w-4 h-4 border-2 rounded-full animate-ripple-expand"
          style={{ 
            left: ripple.x, 
            top: ripple.y,
            borderColor: 'var(--water-accent)'
          }}
        />
      ))}
    </div>
  )
}
