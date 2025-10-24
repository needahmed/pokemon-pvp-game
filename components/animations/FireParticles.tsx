'use client'
import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  opacity: number
  color: string
}

export function FireParticles({ count = 100 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = []

    class ParticleClass implements Particle {
      x: number
      y: number
      size: number
      speedY: number
      opacity: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + Math.random() * 100
        this.size = Math.random() * 3 + 1
        this.speedY = Math.random() * 2 + 1
        this.opacity = Math.random() * 0.5 + 0.5
        this.color = ['#FF4500', '#FF6347', '#FFD700', '#FFA500'][Math.floor(Math.random() * 4)]
      }

      update() {
        this.y -= this.speedY
        this.opacity -= 0.005
        
        if (this.y < -10 || this.opacity <= 0) {
          this.y = canvas.height + Math.random() * 100
          this.opacity = Math.random() * 0.5 + 0.5
        }
      }

      draw() {
        if (!ctx) return
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color
        ctx.shadowBlur = 10
        ctx.shadowColor = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Initialize particles
    for (let i = 0; i < count; i++) {
      particles.push(new ParticleClass())
    }

    // Animation loop
    let animationId: number
    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })
      
      animationId = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [count])

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  )
}
