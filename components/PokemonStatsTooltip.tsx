"use client"

import type { Pokemon } from "@/lib/types";

interface PokemonStatsTooltipProps {
  pokemon: Pokemon;
}

export default function PokemonStatsTooltip({ pokemon }: PokemonStatsTooltipProps) {
  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white p-3 rounded-lg shadow-xl z-50 min-w-[200px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="text-xs space-y-1">
        <div className="font-pokemon text-center mb-2 border-b border-gray-700 pb-1">
          Stats
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">HP:</span>
          <span className="font-semibold">{pokemon.stats.hp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Attack:</span>
          <span className="font-semibold">{pokemon.stats.attack}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Defense:</span>
          <span className="font-semibold">{pokemon.stats.defense}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Sp. Atk:</span>
          <span className="font-semibold">{pokemon.stats.specialAttack}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Sp. Def:</span>
          <span className="font-semibold">{pokemon.stats.specialDefense}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Speed:</span>
          <span className="font-semibold">{pokemon.stats.speed}</span>
        </div>
      </div>
      {/* Tooltip arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
    </div>
  );
}
