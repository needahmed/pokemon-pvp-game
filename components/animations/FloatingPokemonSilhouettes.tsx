'use client'

import Image from 'next/image'

interface FloatingPokemonSilhouettesProps {
  count?: number
}

export function FloatingPokemonSilhouettes({ count = 10 }: FloatingPokemonSilhouettesProps) {
  const pokemonIds = [25, 6, 3, 9, 94, 150, 249, 384, 6, 130]
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-float-slow opacity-10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
          }}
        >
          <Image
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonIds[i]}.png`}
            alt="Pokemon"
            width={96}
            height={96}
            className="filter grayscale"
            unoptimized
          />
        </div>
      ))}
    </div>
  )
}
