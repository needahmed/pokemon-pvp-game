"use client"

import { useState } from "react"
import type { Move } from "@/lib/types"

interface MoveButtonProps {
  move: Move
  onClick: () => void
  disabled?: boolean
}

export default function MoveButton({ move, onClick, disabled = false }: MoveButtonProps) {
  const formatMoveName = (name: string) => {
    return name.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  }

  // Safely access move properties
  const moveName = formatMoveName(move.name || 'Unknown')
  const movePower = move.power !== null ? move.power : '-'
  const movePP = move.pp || '∞'
  const moveType = move.type || 'normal'

  // Type color mapping
  const typeColors: {[key: string]: string} = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC"
  }

  const backgroundColor = typeColors[moveType] || typeColors.normal
  
  // Get contrasting text color (dark text on light backgrounds, light text on dark backgrounds)
  const getContrastColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    
    // Calculate luminance - brighter colors should have dark text
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }
  
  const textColor = getContrastColor(backgroundColor)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-3 rounded-lg font-pokemon text-sm w-full
        transition-all duration-200 shadow-md
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 hover:shadow-lg hover:scale-105"}
        border-2 border-gray-800
      `}
      style={{ 
        backgroundColor,
        color: textColor,
        borderWidth: '2px',
      }}
    >
      <div className="flex flex-col items-center">
        <span className="text-center font-bold mb-1">{moveName}</span>
        <div className="flex justify-between w-full text-xs">
          <span className="font-semibold">PWR: {movePower}</span>
          <span className="font-semibold">{moveType.toUpperCase()}</span>
        </div>
      </div>
    </button>
  )
}
