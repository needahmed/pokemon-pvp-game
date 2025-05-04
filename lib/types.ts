// Basic structure for the list from /pokemon endpoint
export interface PokemonListItem {
  name: string;
  url: string;
}

// Structure for individual move details
export interface Move {
  id?: number; // Optional, may not always be needed
  name: string;
  power: number | null; // Can be null for status moves
  accuracy: number | null; // Can be null 
  pp?: number; // Optional
  type: string; // Name of the type
  damageClass?: string; // Optional: physical, special, status
  // Add other relevant properties like priority, effect_entries etc. if needed
}

// Structure for detailed Pokémon data
export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
  sprites: {
    front: string | null;
    back: string | null;
    icon: string | null;
  };
  moves: Move[]; // Array of selected moves
  currentHp: number; // Current health points for battle
  battleId?: string; // Optional unique ID for battle instance if needed
}

// Structure for battle state updates from the server
export interface BattleUpdate {
  type: 'moveUsed' | 'moveMissed' | 'pokemonFainted' | 'pokemonSwitched' | 'turnChange' | 'forcedSwitch' | 'initialState' | 'message' | 'invalidSwitch';
  attacker?: string;
  defender?: string;
  move?: string;
  damage?: number;
  critical?: boolean;
  effectiveness?: string; // 'super effective', 'not very effective', 'effective', 'no effect'
  defenderHp?: number;
  pokemon?: string; // Name of fainted/switched Pokemon
  oldPokemon?: string; // Name of Pokemon switched out
  newPokemon?: string; // Name of Pokemon switched in
  playerId?: string; // ID of player who needs to act (e.g., forced switch)
  currentTurn?: string; // ID of the player whose turn it is
  message?: string; // General battle message
}

// Structure for the overall battle state
export interface BattleState {
  player1: { 
    id?: string; // Player ID
    team: Pokemon[]; 
    activePokemon: number; // Index in the team array
  };
  player2: { 
    id?: string; // Player ID
    team: Pokemon[]; 
    activePokemon: number; // Index in the team array
  };
  turn: string; // Whose turn is it ("player1" or "player2") - This might be redundant if currentTurn is used
  currentTurn?: string; // Player ID of the current turn holder
  messages: string[]; // Log messages
}
