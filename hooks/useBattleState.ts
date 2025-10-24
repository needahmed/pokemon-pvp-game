import { useReducer, useCallback } from 'react';
import type { BattleState, Pokemon } from '@/lib/types';

// Battle state actions
type BattleAction =
  | { type: 'SET_BATTLE_STATE'; payload: BattleState }
  | { type: 'UPDATE_HP'; payload: { playerId: string; pokemonIndex: number; newHp: number } }
  | { type: 'SWITCH_POKEMON'; payload: { playerId: string; newIndex: number } }
  | { type: 'SET_TURN'; payload: string }
  | { type: 'RESET' };

// Initial battle state
const initialBattleState: BattleState = {
  player1: { team: [], activePokemon: 0 },
  player2: { team: [], activePokemon: 0 },
  turn: 'player1',
  messages: [],
};

// Battle state reducer
function battleStateReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case 'SET_BATTLE_STATE':
      return action.payload;

    case 'UPDATE_HP': {
      const { playerId, pokemonIndex, newHp } = action.payload;
      const playerKey = playerId === state.turn ? 'player1' : 'player2';
      
      const newState = { ...state };
      const team = [...newState[playerKey].team];
      
      if (team[pokemonIndex]) {
        team[pokemonIndex] = {
          ...team[pokemonIndex],
          currentHp: Math.max(0, Math.min(newHp, team[pokemonIndex].maxHp)),
        };
        
        newState[playerKey] = {
          ...newState[playerKey],
          team,
        };
      }
      
      return newState;
    }

    case 'SWITCH_POKEMON': {
      const { playerId, newIndex } = action.payload;
      const playerKey = playerId === state.turn ? 'player1' : 'player2';
      
      return {
        ...state,
        [playerKey]: {
          ...state[playerKey],
          activePokemon: newIndex,
        },
      };
    }

    case 'SET_TURN':
      return {
        ...state,
        turn: action.payload,
      };

    case 'RESET':
      return initialBattleState;

    default:
      return state;
  }
}

// Custom hook for battle state management
export function useBattleState() {
  const [battleState, dispatch] = useReducer(battleStateReducer, initialBattleState);

  const setBattleState = useCallback((state: BattleState) => {
    dispatch({ type: 'SET_BATTLE_STATE', payload: state });
  }, []);

  const updatePokemonHp = useCallback((playerId: string, pokemonIndex: number, newHp: number) => {
    dispatch({ type: 'UPDATE_HP', payload: { playerId, pokemonIndex, newHp } });
  }, []);

  const switchActivePokemon = useCallback((playerId: string, newIndex: number) => {
    dispatch({ type: 'SWITCH_POKEMON', payload: { playerId, newIndex } });
  }, []);

  const setTurn = useCallback((playerId: string) => {
    dispatch({ type: 'SET_TURN', payload: playerId });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    battleState,
    setBattleState,
    updatePokemonHp,
    switchActivePokemon,
    setTurn,
    reset,
  };
}
