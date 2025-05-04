/**
 * Calculate damage using FireRed/LeafGreen battle mechanics
 * @param {Object} attacker - The attacking Pokémon
 * @param {Object} move - The move being used
 * @param {Object} defender - The defending Pokémon
 * @returns {Object} - Damage calculation result
 */
export const calculateDamage = (attacker, move, defender) => {
  // Random factor between 0.85 and 1.0
  const random = 0.85 + Math.random() * 0.15;
  
  // Critical hit (6.25% chance)
  const critical = Math.random() < 0.0625 ? 1.5 : 1.0;
  
  // STAB (Same Type Attack Bonus)
  const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
  
  // Type effectiveness
  const typeEffectiveness = getTypeEffectiveness(move.type, defender.types);
  
  // Base damage formula (simplified FireRed/LeafGreen formula)
  // ((2 * Level / 5 + 2) * Power * Attack / Defense / 50 + 2) * Modifiers
  const level = 50; // All Pokémon are level 50 in battles
  
  // Choose attack and defense stats based on move's damage class
  const attackStat = move.damageClass === 'special' ? attacker.stats.specialAttack : attacker.stats.attack;
  const defenseStat = move.damageClass === 'special' ? defender.stats.specialDefense : defender.stats.defense;
  
  const baseDamage = ((2 * level / 5 + 2) * move.power * attackStat / defenseStat / 50 + 2);
  
  // Apply modifiers
  const finalDamage = Math.floor(baseDamage * stab * typeEffectiveness * critical * random);
  
  return {
    damage: finalDamage,
    critical: critical > 1,
    effectiveness: typeEffectiveness > 1 ? 'super effective' : (typeEffectiveness < 1 ? 'not very effective' : 'effective')
  };
};

/**
 * Calculate type effectiveness multiplier
 * @param {string} moveType - The type of the move
 * @param {Array<string>} defenderTypes - The types of the defending Pokémon
 * @returns {number} - Type effectiveness multiplier
 */
export const getTypeEffectiveness = (moveType, defenderTypes) => {
  // Type effectiveness chart (simplified FireRed/LeafGreen)
  const typeChart = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5 }
  };

  let effectiveness = 1;

  // Apply effectiveness for each defender type
  defenderTypes.forEach(defenderType => {
    if (typeChart[moveType] && typeChart[moveType][defenderType]) {
      effectiveness *= typeChart[moveType][defenderType];
    }
  });

  return effectiveness;
}; 