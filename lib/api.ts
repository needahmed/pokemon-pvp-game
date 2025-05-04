import type { Pokemon, Move, PokemonListItem } from './types';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

// --- Helper Functions --- 

// Simple in-memory cache to avoid hitting API limits
const cache: { [key: string]: any } = {};

async function fetchWithCache<T>(url: string): Promise<T> {
  if (cache[url]) {
    // console.log(`Cache hit for ${url}`);
    return cache[url] as T;
  }
  // console.log(`Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  cache[url] = data;
  // Set a simple timer to clear the cache entry after some time (e.g., 1 hour)
  setTimeout(() => {
    delete cache[url];
  }, 3600 * 1000);
  return data as T;
}

// Format Pokémon names (e.g., "bulbasaur" -> "Bulbasaur")
export function formatPokemonName(name: string): string {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Select up to 4 of the highest power damaging moves
async function selectMoves(pokemonMoves: any[]): Promise<Move[]> {
  const potentialMoves = pokemonMoves.map(m => m.move.url);

  // Fetch details for all potential moves in parallel
  const moveDetailsResponses = await Promise.allSettled(
    potentialMoves.map(url => fetchWithCache<any>(url))
  );
  
  const successfulMoveDetails = moveDetailsResponses
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<any>).value);

  // Filter for damaging moves (power > 0) and sort by power descending
  const damagingMoves = successfulMoveDetails
    .filter(move => move && typeof move.power === 'number' && move.power > 0)
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0)); // Sort by power descending

  // Select the top 4 damaging moves
  const selectedMovesData = damagingMoves.slice(0, 4);

  // Format the selected moves
  const selectedMoves: Move[] = selectedMovesData.map(moveData => ({
    name: moveData.name,
    power: moveData.power,
    accuracy: moveData.accuracy,
    type: moveData.type.name,
    pp: moveData.pp, // Include PP if available
    damageClass: moveData.damage_class?.name // Include damage class if available
  }));

  // Fallback logic: If fewer than 4 damaging moves, fill with other moves (or tackle/struggle)
  if (selectedMoves.length < 4) {
    const nonDamagingMoves = successfulMoveDetails.filter(move => move && typeof move.power !== 'number');
    const remainingSlots = 4 - selectedMoves.length;
    const fillMovesData = nonDamagingMoves.slice(0, remainingSlots);
    
    fillMovesData.forEach(moveData => {
      selectedMoves.push({
        name: moveData.name,
        power: moveData.power ?? null,
        accuracy: moveData.accuracy ?? null,
        type: moveData.type.name,
        pp: moveData.pp,
        damageClass: moveData.damage_class?.name
      });
    });
  }
  
  // If still no moves after attempting to fill, add tackle or struggle
  if (selectedMoves.length === 0 && successfulMoveDetails.length > 0) {
     let fallbackMoveData = successfulMoveDetails.find(m => m.name === 'tackle');
     if (!fallbackMoveData) fallbackMoveData = successfulMoveDetails[0];
     
     if(fallbackMoveData){
       selectedMoves.push({
         name: fallbackMoveData.name,
         power: fallbackMoveData.power ?? null, 
         accuracy: fallbackMoveData.accuracy ?? null, 
         type: fallbackMoveData.type.name,
         pp: fallbackMoveData.pp,
         damageClass: fallbackMoveData.damage_class?.name
       });
     }
  }
  
  // Final fallback: struggle
  if (selectedMoves.length === 0) {
     selectedMoves.push({ 
       name: 'struggle', 
       power: 50, 
       accuracy: 100, 
       type: 'normal', 
       pp: 1, // Struggle technically has infinite PP but represented as 1 here
       damageClass: 'physical'
     });
  }

  return selectedMoves;
}

// --- Exported API Functions --- 

// Fetch the list of all Pokémon (up to Gen 3, #386)
export async function fetchAllPokemon(): Promise<PokemonListItem[]> {
  try {
    const data = await fetchWithCache<{ results: PokemonListItem[] }>(`${POKEAPI_BASE_URL}/pokemon?limit=386`);
    return data.results;
  } catch (error) {
    console.error("Error fetching Pokémon list:", error);
    return [];
  }
}

// Fetch detailed information for a single Pokémon by name
export async function fetchPokemonDetails(name: string): Promise<Pokemon | null> {
  try {
    const pokemonData = await fetchWithCache<any>(`${POKEAPI_BASE_URL}/pokemon/${name.toLowerCase()}`);
    
    const moves = await selectMoves(pokemonData.moves);
    
    return {
      id: pokemonData.id,
      name: pokemonData.name,
      types: pokemonData.types.map((t: any) => t.type.name),
      stats: {
        hp: pokemonData.stats.find((s: any) => s.stat.name === 'hp')?.base_stat ?? 0,
        attack: pokemonData.stats.find((s: any) => s.stat.name === 'attack')?.base_stat ?? 0,
        defense: pokemonData.stats.find((s: any) => s.stat.name === 'defense')?.base_stat ?? 0,
        specialAttack: pokemonData.stats.find((s: any) => s.stat.name === 'special-attack')?.base_stat ?? 0,
        specialDefense: pokemonData.stats.find((s: any) => s.stat.name === 'special-defense')?.base_stat ?? 0,
        speed: pokemonData.stats.find((s: any) => s.stat.name === 'speed')?.base_stat ?? 0,
      },
      sprites: {
        front: pokemonData.sprites?.front_default,
        back: pokemonData.sprites?.back_default,
        icon: pokemonData.sprites?.versions?.['generation-vii']?.icons?.front_default || pokemonData.sprites?.front_default // Use official icon or fallback
      },
      moves: moves, // Add the selected moves
      currentHp: pokemonData.stats.find((s: any) => s.stat.name === 'hp')?.base_stat ?? 0 // Initialize currentHp
    };
  } catch (error) {
    console.error(`Error fetching details for ${name}:`, error);
    return null;
  }
}

// Fetch Pokémon by name or ID (used for searching)
export async function fetchPokemonByNameOrId(query: string): Promise<Pokemon | null> {
  return fetchPokemonDetails(query);
} 