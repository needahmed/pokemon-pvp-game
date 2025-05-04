// Cache for API responses to avoid rate limiting
const apiCache = {};

// Alternative Pokémon sprite CDN to avoid rate limits
const SPRITE_BASE_URL = "https://img.pokemondb.net/sprites/home/normal";
const SPRITE_BACK_URL = "https://img.pokemondb.net/sprites/black-white/back-normal";
const SPRITE_ICON_URL = "https://img.pokemondb.net/sprites/sword-shield/icon";

/**
 * Fetches Pokémon data from PokéAPI with caching
 * @param {string} url - The API URL to fetch from
 * @returns {Promise<Object>} - The API response data
 */
export const fetchFromApi = async (url) => {
  // Check if we have this data cached
  if (apiCache[url]) {
    return apiCache[url];
  }
  
  try {
    console.log(`Fetching from: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'force-cache',
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    apiCache[url] = data;
    
    return data;
  } catch (error) {
    console.error('Error fetching from PokéAPI:', error);
    
    // For demo purposes, return mock data if fetch fails
    if (url.includes('/pokemon?limit=')) {
      console.log('Using mock Pokemon list');
      return mockPokemonList();
    } else if (url.includes('/pokemon/')) {
      const nameOrId = url.split('/').pop();
      console.log(`Using mock data for Pokemon: ${nameOrId}`);
      return mockPokemonDetails(nameOrId);
    }
    
    throw error;
  }
};

/**
 * Get sprite URLs using alternative CDNs to avoid rate limiting
 * @param {number} id - Pokemon ID
 * @param {string} name - Pokemon name
 * @returns {Object} - Object with sprite URLs
 */
export const getSpritesUrls = (id, name) => {
  const formattedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return {
    front: `${SPRITE_BASE_URL}/${formattedName}.png`,
    back: `${SPRITE_BACK_URL}/${formattedName}.png`,
    icon: `${SPRITE_ICON_URL}/${formattedName}.png`,
  };
};

/**
 * Fetches a specific Pokémon by name or ID directly
 * @param {string} nameOrId - Pokemon name or ID
 * @returns {Promise<Object>} - Pokemon data
 */
export const fetchPokemonByNameOrId = async (nameOrId) => {
  try {
    return await fetchPokemonDetails(nameOrId);
  } catch (error) {
    console.error(`Error fetching Pokemon ${nameOrId}:`, error);
    return null;
  }
};

/**
 * Fetches the list of all Pokémon (first 386 - Gens 1-3)
 * @returns {Promise<Array>} - List of Pokémon with basic data
 */
export const fetchAllPokemon = async () => {
  const url = 'https://pokeapi.co/api/v2/pokemon?limit=386';
  const data = await fetchFromApi(url);
  return data.results;
};

/**
 * Fetches detailed data for a specific Pokémon
 * @param {string} nameOrId - The name or ID of the Pokémon
 * @returns {Promise<Object>} - Detailed Pokémon data
 */
export const fetchPokemonDetails = async (nameOrId) => {
  const url = `https://pokeapi.co/api/v2/pokemon/${nameOrId}`;
  const data = await fetchFromApi(url);
  
  // Extract the data we need
  const pokemon = {
    id: data.id,
    name: data.name,
    types: data.types.map(type => type.type.name),
    stats: {
      hp: data.stats.find(stat => stat.stat.name === 'hp').base_stat,
      attack: data.stats.find(stat => stat.stat.name === 'attack').base_stat,
      defense: data.stats.find(stat => stat.stat.name === 'defense').base_stat,
      specialAttack: data.stats.find(stat => stat.stat.name === 'special-attack').base_stat,
      specialDefense: data.stats.find(stat => stat.stat.name === 'special-defense').base_stat,
      speed: data.stats.find(stat => stat.stat.name === 'speed').base_stat
    },
    height: data.height,
    weight: data.weight,
    sprites: getSpritesUrls(data.id, data.name)
  };
  
  // Get moves data
  const moves = await Promise.all(
    data.moves
      // Filter to only moves available in FireRed
      .filter(move => move.version_group_details.some(detail => 
        detail.version_group.name === 'firered-leafgreen'
      ))
      .map(async (moveData) => {
        const moveDetails = await fetchFromApi(moveData.move.url);
        
        // Only return damaging moves
        if (moveDetails.power !== null && moveDetails.damage_class.name !== 'status') {
          return {
            id: moveDetails.id,
            name: moveDetails.name,
            type: moveDetails.type.name,
            power: moveDetails.power,
            accuracy: moveDetails.accuracy || 100,
            pp: moveDetails.pp,
            priority: moveDetails.priority,
            damageClass: moveDetails.damage_class.name
          };
        }
        return null;
      })
  );
  
  // Filter out null values and take up to 4 random moves
  const validMoves = moves.filter(move => move !== null);
  const selectedMoves = validMoves.length <= 4 
    ? validMoves 
    : getRandomItems(validMoves, 4);
  
  pokemon.moves = selectedMoves;
  
  // Set current HP to max HP for battles
  pokemon.currentHp = pokemon.stats.hp;
  
  return pokemon;
};

/**
 * Get random items from an array
 * @param {Array} array - The array to select from
 * @param {number} count - Number of items to select
 * @returns {Array} - Random selection of items
 */
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Formats a Pokémon name for display
 * @param {string} name - The raw Pokémon name
 * @returns {string} - Formatted name
 */
export const formatPokemonName = (name) => {
  // Handle special cases like "mr-mime" or "ho-oh"
  const specialNames = {
    'mr-mime': 'Mr. Mime',
    'mime-jr': 'Mime Jr.',
    'ho-oh': 'Ho-Oh',
    'porygon-z': 'Porygon-Z',
    'jangmo-o': 'Jangmo-o',
    'hakamo-o': 'Hakamo-o',
    'kommo-o': 'Kommo-o'
  };
  
  if (specialNames[name]) {
    return specialNames[name];
  }
  
  // Handle hyphenated forms
  if (name.includes('-')) {
    const parts = name.split('-');
    // If it's a form like "charizard-mega-x"
    if (parts.length > 1) {
      const baseName = parts[0];
      const form = parts.slice(1).join(' ');
      return `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} (${form})`;
    }
  }
  
  // Regular case: Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Mock data functions for fallback when API fails
function mockPokemonList() {
  return {
    results: [
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
      { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' },
      { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
      { name: 'charmeleon', url: 'https://pokeapi.co/api/v2/pokemon/5/' },
      { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' },
      { name: 'squirtle', url: 'https://pokeapi.co/api/v2/pokemon/7/' },
      { name: 'wartortle', url: 'https://pokeapi.co/api/v2/pokemon/8/' },
      { name: 'blastoise', url: 'https://pokeapi.co/api/v2/pokemon/9/' },
      { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' }
    ]
  };
}

function mockPokemonDetails(name) {
  // Create a basic mock Pokemon object
  return {
    id: name === 'pikachu' ? 25 : parseInt(name) || Math.floor(Math.random() * 386) + 1,
    name: name,
    types: ['electric'],
    stats: {
      hp: 35,
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90
    },
    height: 4,
    weight: 60,
    sprites: {
      front: `/sprites/pikachu-front.png`,
      back: `/sprites/pikachu-back.png`,
      icon: `/icons/pikachu-icon.png`
    },
    moves: [
      {
        id: 1,
        name: 'tackle',
        type: 'normal',
        power: 40,
        accuracy: 100,
        pp: 35,
        damageClass: 'physical'
      },
      {
        id: 2,
        name: 'thunder-shock',
        type: 'electric',
        power: 40,
        accuracy: 100,
        pp: 30,
        damageClass: 'special'
      }
    ],
    currentHp: 35
  };
} 