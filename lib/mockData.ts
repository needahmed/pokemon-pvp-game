import type { Pokemon, BattleState } from "./types"

// Mock data for 10 Pokémon (in a real app, this would be all 386)
export const mockPokemonList: Pokemon[] = [
  {
    id: 1,
    name: "bulbasaur",
    sprite: {
      front: "/sprites/bulbasaur-front.png",
      back: "/sprites/bulbasaur-back.png",
      icon: "/icons/bulbasaur-icon.png",
    },
    types: ["grass", "poison"],
    stats: {
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
    },
    moves: [
      { name: "tackle", type: "normal", power: 40, pp: 35, maxPp: 35, category: "physical" },
      { name: "vine whip", type: "grass", power: 45, pp: 25, maxPp: 25, category: "physical" },
      { name: "growl", type: "normal", power: 0, pp: 40, maxPp: 40, category: "status" },
      { name: "leech seed", type: "grass", power: 0, pp: 10, maxPp: 10, category: "status" },
    ],
    currentHp: 45,
  },
  {
    id: 4,
    name: "charmander",
    sprite: {
      front: "/sprites/charmander-front.png",
      back: "/sprites/charmander-back.png",
      icon: "/icons/charmander-icon.png",
    },
    types: ["fire"],
    stats: {
      hp: 39,
      attack: 52,
      defense: 43,
      specialAttack: 60,
      specialDefense: 50,
      speed: 65,
    },
    moves: [
      { name: "scratch", type: "normal", power: 40, pp: 35, maxPp: 35, category: "physical" },
      { name: "ember", type: "fire", power: 40, pp: 25, maxPp: 25, category: "special" },
      { name: "growl", type: "normal", power: 0, pp: 40, maxPp: 40, category: "status" },
      { name: "dragon rage", type: "dragon", power: 0, pp: 10, maxPp: 10, category: "special" },
    ],
    currentHp: 39,
  },
  {
    id: 7,
    name: "squirtle",
    sprite: {
      front: "/sprites/squirtle-front.png",
      back: "/sprites/squirtle-back.png",
      icon: "/icons/squirtle-icon.png",
    },
    types: ["water"],
    stats: {
      hp: 44,
      attack: 48,
      defense: 65,
      specialAttack: 50,
      specialDefense: 64,
      speed: 43,
    },
    moves: [
      { name: "tackle", type: "normal", power: 40, pp: 35, maxPp: 35, category: "physical" },
      { name: "water gun", type: "water", power: 40, pp: 25, maxPp: 25, category: "special" },
      { name: "tail whip", type: "normal", power: 0, pp: 30, maxPp: 30, category: "status" },
      { name: "bubble", type: "water", power: 40, pp: 30, maxPp: 30, category: "special" },
    ],
    currentHp: 44,
  },
  {
    id: 25,
    name: "pikachu",
    sprite: {
      front: "/sprites/pikachu-front.png",
      back: "/sprites/pikachu-back.png",
      icon: "/icons/pikachu-icon.png",
    },
    types: ["electric"],
    stats: {
      hp: 35,
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90,
    },
    moves: [
      { name: "thunder shock", type: "electric", power: 40, pp: 30, maxPp: 30, category: "special" },
      { name: "quick attack", type: "normal", power: 40, pp: 30, maxPp: 30, category: "physical" },
      { name: "growl", type: "normal", power: 0, pp: 40, maxPp: 40, category: "status" },
      { name: "thunderbolt", type: "electric", power: 90, pp: 15, maxPp: 15, category: "special" },
    ],
    currentHp: 35,
  },
  {
    id: 133,
    name: "eevee",
    sprite: {
      front: "/sprites/eevee-front.png",
      back: "/sprites/eevee-back.png",
      icon: "/icons/eevee-icon.png",
    },
    types: ["normal"],
    stats: {
      hp: 55,
      attack: 55,
      defense: 50,
      specialAttack: 45,
      specialDefense: 65,
      speed: 55,
    },
    moves: [
      { name: "tackle", type: "normal", power: 40, pp: 35, maxPp: 35, category: "physical" },
      { name: "sand attack", type: "ground", power: 0, pp: 15, maxPp: 15, category: "status" },
      { name: "quick attack", type: "normal", power: 40, pp: 30, maxPp: 30, category: "physical" },
      { name: "bite", type: "dark", power: 60, pp: 25, maxPp: 25, category: "physical" },
    ],
    currentHp: 55,
  },
  {
    id: 94,
    name: "gengar",
    sprite: {
      front: "/sprites/gengar-front.png",
      back: "/sprites/gengar-back.png",
      icon: "/icons/gengar-icon.png",
    },
    types: ["ghost", "poison"],
    stats: {
      hp: 60,
      attack: 65,
      defense: 60,
      specialAttack: 130,
      specialDefense: 75,
      speed: 110,
    },
    moves: [
      { name: "shadow ball", type: "ghost", power: 80, pp: 15, maxPp: 15, category: "special" },
      { name: "sludge bomb", type: "poison", power: 90, pp: 10, maxPp: 10, category: "special" },
      { name: "hypnosis", type: "psychic", power: 0, pp: 20, maxPp: 20, category: "status" },
      { name: "dream eater", type: "psychic", power: 100, pp: 15, maxPp: 15, category: "special" },
    ],
    currentHp: 60,
  },
  {
    id: 149,
    name: "dragonite",
    sprite: {
      front: "/sprites/dragonite-front.png",
      back: "/sprites/dragonite-back.png",
      icon: "/icons/dragonite-icon.png",
    },
    types: ["dragon", "flying"],
    stats: {
      hp: 91,
      attack: 134,
      defense: 95,
      specialAttack: 100,
      specialDefense: 100,
      speed: 80,
    },
    moves: [
      { name: "dragon claw", type: "dragon", power: 80, pp: 15, maxPp: 15, category: "physical" },
      { name: "fly", type: "flying", power: 90, pp: 15, maxPp: 15, category: "physical" },
      { name: "thunder punch", type: "electric", power: 75, pp: 15, maxPp: 15, category: "physical" },
      { name: "hyper beam", type: "normal", power: 150, pp: 5, maxPp: 5, category: "special" },
    ],
    currentHp: 91,
  },
  {
    id: 150,
    name: "mewtwo",
    sprite: {
      front: "/sprites/mewtwo-front.png",
      back: "/sprites/mewtwo-back.png",
      icon: "/icons/mewtwo-icon.png",
    },
    types: ["psychic"],
    stats: {
      hp: 106,
      attack: 110,
      defense: 90,
      specialAttack: 154,
      specialDefense: 90,
      speed: 130,
    },
    moves: [
      { name: "psychic", type: "psychic", power: 90, pp: 10, maxPp: 10, category: "special" },
      { name: "shadow ball", type: "ghost", power: 80, pp: 15, maxPp: 15, category: "special" },
      { name: "aura sphere", type: "fighting", power: 80, pp: 20, maxPp: 20, category: "special" },
      { name: "recover", type: "normal", power: 0, pp: 10, maxPp: 10, category: "status" },
    ],
    currentHp: 106,
  },
  {
    id: 6,
    name: "charizard",
    sprite: {
      front: "/sprites/charizard-front.png",
      back: "/sprites/charizard-back.png",
      icon: "/icons/charizard-icon.png",
    },
    types: ["fire", "flying"],
    stats: {
      hp: 78,
      attack: 84,
      defense: 78,
      specialAttack: 109,
      specialDefense: 85,
      speed: 100,
    },
    moves: [
      { name: "flamethrower", type: "fire", power: 90, pp: 15, maxPp: 15, category: "special" },
      { name: "dragon claw", type: "dragon", power: 80, pp: 15, maxPp: 15, category: "physical" },
      { name: "air slash", type: "flying", power: 75, pp: 15, maxPp: 15, category: "special" },
      { name: "earthquake", type: "ground", power: 100, pp: 10, maxPp: 10, category: "physical" },
    ],
    currentHp: 78,
  },
  {
    id: 9,
    name: "blastoise",
    sprite: {
      front: "/sprites/blastoise-front.png",
      back: "/sprites/blastoise-back.png",
      icon: "/icons/blastoise-icon.png",
    },
    types: ["water"],
    stats: {
      hp: 79,
      attack: 83,
      defense: 100,
      specialAttack: 85,
      specialDefense: 105,
      speed: 78,
    },
    moves: [
      { name: "hydro pump", type: "water", power: 110, pp: 5, maxPp: 5, category: "special" },
      { name: "ice beam", type: "ice", power: 90, pp: 10, maxPp: 10, category: "special" },
      { name: "flash cannon", type: "steel", power: 80, pp: 10, maxPp: 10, category: "special" },
      { name: "earthquake", type: "ground", power: 100, pp: 10, maxPp: 10, category: "physical" },
    ],
    currentHp: 79,
  },
]

// Mock battle state
export const mockBattleState: BattleState = {
  player1: {
    team: [
      { ...mockPokemonList[1], currentHp: 39 }, // Charmander
      { ...mockPokemonList[2], currentHp: 44 }, // Squirtle
      { ...mockPokemonList[0], currentHp: 45 }, // Bulbasaur
      { ...mockPokemonList[3], currentHp: 35 }, // Pikachu
      { ...mockPokemonList[4], currentHp: 55 }, // Eevee
      { ...mockPokemonList[5], currentHp: 60 }, // Gengar
    ],
    activePokemon: 0,
  },
  player2: {
    team: [
      { ...mockPokemonList[8], currentHp: 79 }, // Blastoise
      { ...mockPokemonList[9], currentHp: 78 }, // Charizard
      { ...mockPokemonList[6], currentHp: 91 }, // Dragonite
      { ...mockPokemonList[7], currentHp: 106 }, // Mewtwo
      { ...mockPokemonList[4], currentHp: 55 }, // Eevee
      { ...mockPokemonList[5], currentHp: 60 }, // Gengar
    ],
    activePokemon: 0,
  },
  turn: "player1",
}
