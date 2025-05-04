"use client"

import Image from "next/image"
import { useState } from "react"
import type { Pokemon } from "@/lib/types"
import { formatPokemonName } from "@/lib/api"

interface PokemonCardProps {
  pokemon: Pokemon
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}

export default function PokemonCard({ pokemon, isSelected, onSelect, disabled = false }: PokemonCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Use the front sprite from Pokemon DB
  const spriteSrc = pokemon.sprites?.front || "/placeholder.svg";
  const fallbackSrc = "/placeholder.svg";
  
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-3 cursor-pointer transition-all duration-200
        ${isSelected ? "border-4 border-blue-500" : "border border-gray-200"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"}
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
        {pokemon.types.map((type, index) => (
          <span key={index} className={`text-xs px-2 py-1 rounded text-white font-pokemon bg-${type}`}>
            {type}
          </span>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-center text-gray-500">
        #{pokemon.id}
      </div>
    </div>
  )
}
