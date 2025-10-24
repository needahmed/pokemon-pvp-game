"use client"

import Image from "next/image"
import { useState } from "react"
import type { Pokemon } from "@/lib/types"
import { formatPokemonName } from "@/lib/api"
import PokemonStatsTooltip from "./PokemonStatsTooltip"

interface PokemonCardProps {
  pokemon: Pokemon
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
  showStats?: boolean
}

export default function PokemonCard({ pokemon, isSelected, onSelect, disabled = false, showStats = true }: PokemonCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Use the front sprite from Pokemon DB
  const spriteSrc = pokemon.sprites?.front || "/placeholder.svg";
  const fallbackSrc = "/placeholder.svg";
  
  return (
    <div
      className={`
        group relative bg-white rounded-lg shadow-md p-3 cursor-pointer transition-all duration-200
        ${isSelected ? "border-4 border-blue-500 scale-105" : "border border-gray-200"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg hover:scale-105"}
      `}
      onClick={() => !disabled && onSelect()}
    >
      <div className="flex justify-center mb-2 h-24">
        <Image 
          src={imageError ? fallbackSrc : spriteSrc}
          alt={pokemon.name}
          width={96}
          height={96}
          className="object-contain h-full w-auto"
          onError={() => setImageError(true)}
          unoptimized
        />
      </div>

      <h3 className="text-center font-pokemon text-sm capitalize truncate">
        {formatPokemonName(pokemon.name)}
      </h3>

      <div className="flex justify-center mt-2 gap-1">
        {pokemon.types.map((type, index) => {
          const lightTypes = ['electric', 'ice', 'fairy', 'normal'];
          const textColor = lightTypes.includes(type.toLowerCase()) ? '#000' : '#fff';
          
          return (
            <span 
              key={index} 
              className="text-xs px-2 py-1 rounded font-pokemon uppercase"
              style={{ 
                backgroundColor: `var(--color-${type.toLowerCase()})`,
                color: textColor
              }}
            >
              {type}
            </span>
          );
        })}
      </div>
      
      <div className="mt-2 text-xs text-center text-gray-500">
        #{pokemon.id}
      </div>
      
      {/* Stats Tooltip - shows on hover */}
      {showStats && <PokemonStatsTooltip pokemon={pokemon} />}
    </div>
  )
}
