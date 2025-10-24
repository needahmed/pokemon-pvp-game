"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import AudioPlayer from "@/components/AudioPlayer"
import { ConfettiEffect } from "@/components/animations/ConfettiEffect"
import { BattleParticles } from "@/components/animations/BattleParticles"
import type { BattleState, Pokemon, Move, BattleUpdate } from "@/lib/types"
import { formatPokemonName } from "@/lib/api"
import io, { Socket } from "socket.io-client"

// Reuse socket from previous pages
let socket: Socket | null = null;

export default function Battle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get("roomId")
  const playerId = searchParams.get("playerId")
  const audioRef = useRef<HTMLAudioElement>(null)

  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>(["Battle starting..."])
  const [isLoading, setIsLoading] = useState(true)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [error, setError] = useState("")
  const [showDebug, setShowDebug] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const battleLogRef = useRef<HTMLDivElement>(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [remainingPokemon, setRemainingPokemon] = useState(0)

  // New state for ultimate redesign
  const [showSettings, setShowSettings] = useState(false)
  const [showBagModal, setShowBagModal] = useState(false)
  const [showRunModal, setShowRunModal] = useState(false)
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false)
  const [showMoveSelection, setShowMoveSelection] = useState(false)
  const [showSwitchSelection, setShowSwitchSelection] = useState(false)
  const [showBattleLog, setShowBattleLog] = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [damageFlash, setDamageFlash] = useState(false)

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!roomId || !playerId) {
      console.log("Missing roomId or playerId, redirecting to home");
      router.push("/")
      return
    }

    console.log(`%c BATTLE PAGE LOADED`, 'background: #00ff00; color: black; font-size: 20px');
    console.log(`Room ID: ${roomId}, Player ID: ${playerId}`);

    let joinedBattleRoom = false;
    let connectionAttempts = 0;
    const MAX_CONNECTION_ATTEMPTS = 3;

    if (!socket) {
      console.log("Creating new socket connection for battle page...");
      const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
      console.log(`Battle Page Socket URL: ${socketURL}`);
      socket = io(socketURL, {
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'] 
      });
      
      socket.io.on("reconnect_attempt", (attempt) => {
        console.log(`Socket reconnection attempt ${attempt}`);
      });
      
      socket.io.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
      });
      
      socket.io.on("reconnect_failed", () => {
        console.error("Socket reconnection failed after all attempts");
      });
      
      socket.io.on("error", (error) => {
        console.error("Socket.IO error:", error);
      });
    } else {
      console.log("Reusing existing socket connection:", socket.id);
    }

    const cleanup = () => {
      console.log("Cleaning up battle page socket listeners");
      
      if (socket) {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("battleUpdate");
        socket.off("battleEnd");
        socket.off("battleState");
        socket.off("battleError");
        socket.off("playerDisconnected");
      }
    };

    socket?.on("connect", () => {
      console.log(`%c SOCKET CONNECTED IN BATTLE PAGE: ${socket?.id}`, 'background: #00ff00; color: black; font-size: 16px');
      
      if (!joinedBattleRoom && socket) {
        console.log(`%c ATTEMPTING TO JOIN BATTLE ROOM - roomId:${roomId}, playerId:${playerId}`, 'background: #ff00ff; color: white; font-size: 16px');
        socket.emit("joinBattleRoom", { roomId, playerId });
        joinedBattleRoom = true;
        connectionAttempts++;
        
        setTimeout(() => {
          if (isLoading && battleState?.player1?.team?.length === 0) {
            console.warn("No battle state received after 5 seconds. Connection might have issues.");
            socket?.emit("ping", { timestamp: Date.now() });
          }
        }, 5000);
      }
    });

    socket?.io.on("reconnect", () => {
      console.log("Socket reconnected - rejoining battle room");
      socket?.emit("joinBattleRoom", { roomId, playerId });
    });

    socket?.on("connect_error", (err) => {
      console.error("Connection error in battle page:", err);
      setError(`Connection error: ${err.message}. Please try refreshing the page.`);
    });

    socket?.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      
      if ((reason === "io server disconnect" || reason === "transport close") && socket) {
        console.log("Attempting manual reconnection");
        socket.connect();
      }
    });

    setBattleState({
      player1: { team: [], activePokemon: 0 },
      player2: { team: [], activePokemon: 0 },
      turn: "player1",
      messages: []
    });
    
    addToBattleLog("Connecting to game server...");
    
    socket?.on("battleState", (state) => {
      console.log("%c Received battle state:", 'background: #00ff00; color: black; font-size: 16px');
      console.log(state);
      
      const isValidState = state && 
                          state.player1 && state.player1.team && state.player1.team.length > 0 &&
                          state.player2 && state.player2.team && state.player2.team.length > 0;
      
      if (isValidState) {
        console.log("Battle state is valid, updating UI");
        setBattleState(state);
        addToBattleLog("Battle state received from server!");
        
        if (state.currentTurn) {
          setIsMyTurn(state.currentTurn === playerId);
          addToBattleLog(state.currentTurn === playerId ? "Your turn!" : "Opponent's turn!");
          console.log(`Initial turn: ${state.currentTurn}, isMyTurn: ${state.currentTurn === playerId}`);
        }
        
        setIsLoading(false);
      } else {
        console.error("Received invalid battle state:", state);
        setError("Invalid battle state received. Please refresh and try again.");
        addToBattleLog("Error: Invalid battle data received.");
      }
    });

    socket.on("battleUpdate", (update: BattleUpdate) => {
      console.log("[BattlePage] Battle update received:", JSON.parse(JSON.stringify(update)));
      
      // Trigger damage flash animation
      if (update.type === "moveUsed" && update.damage) {
        setDamageFlash(true);
        setTimeout(() => setDamageFlash(false), 300);
      }
      
      switch (update.type) {
        case "moveUsed":
          addToBattleLog(`${update.attacker} used ${update.move}!`);
          if (update.move && soundEnabled) playMoveSound(update.move);
          if (update.critical) addToBattleLog("A critical hit!");
          if (update.effectiveness === "super effective") addToBattleLog("It's super effective!");
          else if (update.effectiveness === "not very effective") addToBattleLog("It's not very effective...");
          if (typeof update.damage === 'number') addToBattleLog(`It dealt ${update.damage} damage!`);
          break;
        case "moveMissed":
          addToBattleLog(`${update.attacker} used ${update.move}!`);
          addToBattleLog("But it missed!");
          break;
        case "pokemonFainted":
          addToBattleLog(`${update.pokemon} fainted!`);
          if (battleState && update.pokemon) {
            const myPlayer = (battleState.player1.id === playerId) ? battleState.player1 : battleState.player2;
            const myActivePokemon = myPlayer.team[myPlayer.activePokemon];
            if (myActivePokemon && formatPokemonName(myActivePokemon.name) === update.pokemon) {
              addToBattleLog("Choose a new Pokémon!");
            }
          }
          break;
        case "pokemonSwitched":
          if (update.oldPokemon && update.newPokemon) {
            addToBattleLog(`${update.oldPokemon} was called back!`);
            addToBattleLog(`${update.newPokemon} was sent out!`);
          }
          break;
        case "turnChange":
          if (update.currentTurn) {
            setIsMyTurn(update.currentTurn === playerId);
            addToBattleLog(update.currentTurn === playerId ? "Your turn!" : "Opponent's turn!");
            console.log(`[BattlePage] Turn changed to: ${update.currentTurn}. Is my turn: ${update.currentTurn === playerId}`);
          }
          break;
        case "forcedSwitch":
          if (update.playerId === playerId) addToBattleLog("Choose a new Pokémon!");
          else addToBattleLog("Opponent is choosing a new Pokémon...");
          break;
        case "invalidSwitch":
          addToBattleLog(update.message || "Unable to switch Pokémon.");
          break;
        case "message":
          if(update.message) addToBattleLog(update.message);
          break;
      }

      setBattleState(prev => {
        if (!prev) {
          console.warn("[BattlePage] setBattleState called with null prev state. Update type:", update.type);
          return prev; 
        }

        const newState = JSON.parse(JSON.stringify(prev)); 

        switch (update.type) {
          case "moveUsed":
            if (update.attacker && update.defender && typeof update.defenderHp === 'number') {
              console.log(`[BattlePage:setBattleState:moveUsed] Attacker: ${update.attacker}, Defender: ${update.defender}, HP: ${update.defenderHp}`);
              const attackerNameLower = update.attacker.toLowerCase();
              const defenderNameFromServerLower = update.defender.toLowerCase();
              let hpUpdated = false;

              const p1Active = newState.player1.team[newState.player1.activePokemon];
              const p2Active = newState.player2.team[newState.player2.activePokemon];

              if (p1Active && p1Active.name.toLowerCase() === defenderNameFromServerLower) {
                if (p2Active && p2Active.name.toLowerCase() === attackerNameLower) {
                    console.log(`  -> Updating P1 ${p1Active.name} HP: ${p1Active.currentHp} -> ${update.defenderHp}`);
                    p1Active.currentHp = update.defenderHp;
                    hpUpdated = true;
                } else if (!p2Active || p2Active.name.toLowerCase() !== attackerNameLower) {
                    if (p1Active.name.toLowerCase() === attackerNameLower) {
                        console.log(`  -> SELF HIT: Updating P1 ${p1Active.name} HP: ${p1Active.currentHp} -> ${update.defenderHp}`);
                        p1Active.currentHp = update.defenderHp;
                        hpUpdated = true;
                    } else {
                         console.warn(`  -> Ambiguous: P1 (${p1Active.name}) matches defender, but P2 (${p2Active?.name}) is not attacker (${attackerNameLower}). Assuming P1 is defender.`);
                         p1Active.currentHp = update.defenderHp;
                         hpUpdated = true;
                    }
                }
              } else if (p2Active && p2Active.name.toLowerCase() === defenderNameFromServerLower) {
                if (p1Active && p1Active.name.toLowerCase() === attackerNameLower) {
                    console.log(`  -> Updating P2 ${p2Active.name} HP: ${p2Active.currentHp} -> ${update.defenderHp}`);
                    p2Active.currentHp = update.defenderHp;
                    hpUpdated = true;
                } else if (!p1Active || p1Active.name.toLowerCase() !== attackerNameLower) {
                    if (p2Active.name.toLowerCase() === attackerNameLower) {
                        console.log(`  -> SELF HIT: Updating P2 ${p2Active.name} HP: ${p2Active.currentHp} -> ${update.defenderHp}`);
                        p2Active.currentHp = update.defenderHp;
                        hpUpdated = true;
                    } else {
                        console.warn(`  -> Ambiguous: P2 (${p2Active.name}) matches defender, but P1 (${p1Active?.name}) is not attacker (${attackerNameLower}). Assuming P2 is defender.`);
                        p2Active.currentHp = update.defenderHp;
                        hpUpdated = true;
                    }
                }
              }
              
              if (!hpUpdated) {
                console.warn(`  -> HP NOT UPDATED. Defender: ${update.defender}, Attacker: ${update.attacker}. Active P1: ${p1Active?.name}, Active P2: ${p2Active?.name}`);
              }
            } else {
              console.warn("[BattlePage:setBattleState:moveUsed] Missing attacker, defender, or HP in update:", update);
            }
            break;

          case "pokemonFainted":
            if (update.pokemon && update.playerId) {
              const faintedPokemonNameLower = update.pokemon.toLowerCase();
              console.log(`[BattlePage:setBattleState:pokemonFainted] Processing fainted: ${update.pokemon} owned by ${update.playerId}`);
              let faintedSet = false;

              const ownerPlayerKey = newState.player1.id === update.playerId ? 'player1' : 'player2';
              const ownerPlayer = newState[ownerPlayerKey];

              if (ownerPlayer) {
                const activePoke = ownerPlayer.team[ownerPlayer.activePokemon];
                if (activePoke && activePoke.name.toLowerCase() === faintedPokemonNameLower) {
                  if (activePoke.currentHp > 0) {
                    console.log(`  -> Marking active ${activePoke.name} of player ${update.playerId} as fainted (HP 0).`);
                    activePoke.currentHp = 0;
                  }
                  faintedSet = true;
                } else {
                  const teamIdx = ownerPlayer.team.findIndex((p: Pokemon) => p.name.toLowerCase() === faintedPokemonNameLower);
                  if (teamIdx !== -1) {
                    if (ownerPlayer.team[teamIdx].currentHp > 0) {
                      console.log(`  -> Marking benched ${ownerPlayer.team[teamIdx].name} of player ${update.playerId} as fainted (HP 0).`);
                      ownerPlayer.team[teamIdx].currentHp = 0;
                    }
                    faintedSet = true;
                  }
                }
              } else {
                console.error(`  -> Owner player ${update.playerId} not found in battle state!`);
              }
              
              if(!faintedSet) console.warn(`  -> ${update.pokemon} (owner: ${update.playerId}) already marked with 0 HP or not found in owner's team.`);
            } else {
              console.warn("[BattlePage:setBattleState:pokemonFainted] Missing pokemon name or playerId in update:", update);
            }
            break;

          case "pokemonSwitched":
            if (update.playerId && update.newPokemon) {
              console.log(`[BattlePage:setBattleState:pokemonSwitched] Processing switch for ${update.playerId} to ${update.newPokemon}`);
              const playerKey = newState.player1.id === update.playerId ? 'player1' : 'player2';
              const playerToUpdate = newState[playerKey];
              const newPokemonNameLower = update.newPokemon.toLowerCase();
              const newIdx = playerToUpdate.team.findIndex((p: Pokemon) => p.name.toLowerCase() === newPokemonNameLower);
              if (newIdx !== -1) {
                console.log(`  -> ${playerKey} active Pokemon index: ${playerToUpdate.activePokemon} -> ${newIdx}`);
                playerToUpdate.activePokemon = newIdx;
              } else {
                console.error(`  -> Could not find ${update.newPokemon} in ${playerKey}'s team.`);
              }
            } else {
              console.warn("[BattlePage:setBattleState:pokemonSwitched] Missing playerId or newPokemon in update:", update);
            }
            break;
            
          case "turnChange":
            if (update.currentTurn) {
              console.log(`[BattlePage:setBattleState:turnChange] Updating currentTurn in state to: ${update.currentTurn}`);
              newState.currentTurn = update.currentTurn;
            }
            break;
        }
        return newState;
      });
    });
    
    socket.on("battleEnd", ({ winner: winnerId, loser }) => {
      console.log("Battle ended:", winnerId, loser)
      
      const isWinner = winnerId === playerId
      
      console.log("Battle end detected", {
        winnerId,
        playerId,
        isWinner,
        battleStateExists: !!battleState,
        playerTeamSize: battleState?.player1?.team?.length,
        opponentTeamSize: battleState?.player2?.team?.length
      });
      
      let pokemonLeft = 0;
      try {
        if (battleState) {
          const winnerTeamKey = (battleState.player1.id === winnerId) ? 'player1' : 'player2';
          const winnerTeam = battleState[winnerTeamKey].team;
          
          console.log("Winner team data:", {
            teamKey: winnerTeamKey,
            teamExists: !!winnerTeam,
            teamSize: winnerTeam?.length
          });
          
          if (winnerTeam && Array.isArray(winnerTeam)) {
            pokemonLeft = winnerTeam.filter(p => p && p.currentHp > 0).length;
            
            if (pokemonLeft === 0 && isWinner) {
              pokemonLeft = 1;
            }
          } else {
            console.error("Winner team not found in battle state");
            pokemonLeft = isWinner ? 1 : 0;
          }
        } else {
          console.warn("No battle state available for winner calculation");
          pokemonLeft = isWinner ? 1 : 0;
        }
      } catch (error) {
        console.error("Error calculating remaining Pokémon:", error);
        pokemonLeft = isWinner ? 1 : 0;
      }
      
      if (winnerId === playerId) {
        addToBattleLog("You won the battle!")
      } else {
        addToBattleLog("You lost the battle!")
      }
      
      setWinner(isWinner ? "You" : "Opponent")
      setRemainingPokemon(pokemonLeft)
      setGameOver(true)
    })
    
    socket.on("playerDisconnectedUpdate", ({ playerId: disconnectedPlayerId, roomId: eventRoomId, players }) => {
      if (eventRoomId !== roomId) return;
      
      console.log("Player disconnection update received:", { disconnectedPlayerId, players });
      addToBattleLog(`Player ${disconnectedPlayerId} connection status changed.`);
    });
    
    socket.on("battleError", (error) => {
      console.error("%c Battle error received:", 'background: #ff0000; color: white; font-size: 16px');
      console.error(error);
      setError(error.message || "An error occurred with the battle");
      addToBattleLog(`Error: ${error.message || "Connection issue"} (Code: ${error.code || 'UNKNOWN'})`);

      if (error.code === 'BATTLE_NOT_STARTED' || 
          error.code === 'BATTLE_DATA_MISSING' || 
          error.code === 'BATTLE_DATA_INCOMPLETE') {
          
        console.log(`Battle initialization error (Code: ${error.code}), attempting to retry...`);
        
        addToBattleLog("Battle initialization failed. Retrying...");
        addToBattleLog(`Attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS}...`);
        setConnectionStatus(`Initialization Error (${error.code}) - Retrying...`);

        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
          console.log(`Retry attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS}`);
          
          setTimeout(() => {
            if (socket && socket.connected) {
              console.log("Retrying joinBattleRoom...");
              setConnectionAttempt(prev => prev + 1);
              socket.emit("joinBattleRoom", { roomId, playerId });
            }
          }, 3000);
        } else {
          console.log("Max retry attempts reached, stopping retries.");
          setIsLoading(false);
          setError(`Failed to initialize battle after multiple attempts (Code: ${error.code}). Please return to team selection or the main menu.`);
          addToBattleLog("Unable to join battle after multiple attempts.");
          addToBattleLog("Please use the buttons below to navigate.");
          setConnectionStatus(`Failed (Code: ${error.code})`);
        }
      } else if (error.code === 'INVALID_TEAM') {
        setIsLoading(false);
        setError("Your team is invalid. Please return to team selection.");
        addToBattleLog("Error: Invalid team detected by server.");
        setConnectionStatus("Failed (Invalid Team)");
      } else {
        setIsLoading(false);
        setConnectionStatus(`Failed (Code: ${error.code || 'UNKNOWN'})`);
      }
    });
    
    return cleanup;
  }, [roomId, playerId, router])

  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  const addToBattleLog = (message: string) => {
    setBattleLog(prev => [...prev, message])
  }
  
  const playMoveSound = (moveName: string) => {
    try {
      const audio = new Audio(`/audio/${moveName.toLowerCase().replace(" ", "-")}.wav`)
      audio.play().catch(err => console.error("Error playing sound:", err))
    } catch (error) {
      console.error("Error with sound effect:", error)
    }
  }

  const handleUseMove = (move: Move) => {
    if (!battleState || !socket || !roomId || !playerId) return;
    
    console.log("Attempting to use move:", {
      move,
      isMyTurn,
      pokemonId: isPlayer1 ? battleState.player1.activePokemon : battleState.player2.activePokemon
    });
    
    if (!isMyTurn) {
      console.log("Cannot make move - not player's turn");
      addToBattleLog("It's not your turn yet!");
      return;
    }
    
    socket.emit("makeMove", {
      roomId,
      playerId,
      move,
      pokemonId: isPlayer1 ? battleState.player1.activePokemon : battleState.player2.activePokemon
    });
  }

  const handleSwitchPokemon = (index: number) => {
    if (!battleState || !socket || !roomId || !playerId) return;
    
    const team = isPlayer1 ? battleState.player1.team : battleState.player2.team;
    const currentActive = isPlayer1 ? battleState.player1.activePokemon : battleState.player2.activePokemon;
    
    console.log("Attempting to switch Pokémon:", {
      fromIndex: currentActive,
      toIndex: index,
      isMyTurn
    });
    
    if (team.length <= index || team[index].currentHp <= 0) {
      console.log("Cannot switch to fainted Pokémon");
      addToBattleLog(`${formatPokemonName(team[index].name)} has fainted and cannot fight!`);
      return;
    }
    
    if (currentActive === index) {
      console.log("Pokémon already active");
      addToBattleLog(`${formatPokemonName(team[index].name)} is already in battle!`);
      return;
    }
    
    const activePokemon = team[currentActive];
    const isForcedSwitch = activePokemon?.currentHp <= 0;
    
    const recentLogs = battleLog.slice(-5);
    const switchRequiredInLog = recentLogs.some(log => 
      log.includes("Choose a new Pokémon") || 
      log.includes("fainted") && log.includes(formatPokemonName(activePokemon?.name || ""))
    );
    
    const isFirstTurn = battleLog.filter(log => log.includes("used")).length === 0;
    
    if (!isForcedSwitch && !switchRequiredInLog && !isMyTurn && !isFirstTurn) {
      console.log("Cannot switch - not player's turn (after first turn) and not a forced switch");
      addToBattleLog("It's not your turn to switch!");
      return;
    }
    
    socket.emit("switchPokemon", {
      roomId,
      playerId,
      newPokemonId: team[index].id,
      isForcedSwitch: isForcedSwitch || switchRequiredInLog
    });
    
    addToBattleLog(`Switching to ${formatPokemonName(team[index].name)}...`);
  }

  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  }

  const getStateSummary = () => {
    if (!battleState) return "No battle state";
    
    try {
      return {
        player1: {
          activePokemon: battleState.player1.activePokemon,
          teamSize: battleState.player1.team.length,
          pokemonNames: battleState.player1.team.map(p => p.name).join(", ")
        },
        player2: {
          activePokemon: battleState.player2.activePokemon,
          teamSize: battleState.player2.team.length,
          pokemonNames: battleState.player2.team.map(p => p.name).join(", ")
        },
        turn: battleState.turn,
        currentTurn: (battleState as any).currentTurn || "unknown"
      };
    } catch (e: any) {
      return `Error parsing battle state: ${e?.message || "Unknown error"}`;
    }
  }

  const forceRetry = () => {
    if (socket && socket.connected) {
      console.log("Forcing battle room rejoin...");
      socket.emit("joinBattleRoom", { roomId, playerId });
      setConnectionAttempt(prev => prev + 1);
      setConnectionStatus("Retrying connection...");
    } else {
      setError("Socket not connected. Please refresh the page.");
    }
  }

  const goToTeamSelection = () => {
    window.location.href = `/team-selection?roomId=${roomId}&playerId=${playerId}`;
  }

  const handleRematchSameTeam = () => {
    if (!socket || !roomId || !playerId) return;
    
    socket.emit("requestRematch", {
      roomId,
      playerId,
      keepTeam: true
    });
    
    addToBattleLog("Requested rematch with same team...");
    setGameOver(false);
  }
  
  const handleRematchNewTeam = () => {
    if (!roomId || !playerId) return;
    
    window.location.href = `/team-selection?roomId=${roomId}&playerId=${playerId}`;
  }
  
  const handleGoHome = () => {
    window.location.href = "/";
  }

  if (isLoading || !battleState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-battle-arena">
        <h1 className="text-white text-2xl font-display mb-4">Loading Battle...</h1>
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-red-600"></div>
        <p className="text-white mt-4 font-tech">Connecting to Socket.IO server...</p>
        <p className="text-white mt-2 font-tech text-sm">Connection status: {connectionStatus}</p>
        <p className="text-white mt-1 font-tech text-sm">Attempt: {connectionAttempt + 1}/3</p>
        
        <div className="mt-8 space-y-2">
          <button 
            onClick={forceRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white font-tech py-1 px-4 rounded-lg text-sm"
          >
            Force Retry
          </button>
          <button 
            onClick={goToTeamSelection}
            className="bg-gray-500 hover:bg-gray-600 text-white font-tech py-1 px-4 rounded-lg text-sm ml-2"
          >
            Return to Team Selection
          </button>
        </div>
      </div>
    )
  }

  const hasPlayerPokemon = battleState.player1.team.length > 0
  const hasOpponentPokemon = battleState.player2.team.length > 0
  
  if (!hasPlayerPokemon || !hasOpponentPokemon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-battle-arena">
        <h1 className="text-white text-2xl font-display mb-4">Waiting for Battle Data...</h1>
        <div className="animate-bounce mb-4">
          <Image 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
            alt="Loading" 
            width={64} 
            height={64}
            unoptimized
          />
        </div>
        <p className="text-white mt-4 font-tech text-center max-w-md">
          Battle is starting soon. Waiting for player and opponent information.
          <br /><br />
          If this takes too long, try returning to the home page and reconnecting.
        </p>
        
        <div className="mt-8">
          <button 
            onClick={toggleDebug}
            className="bg-gray-800 text-white font-tech py-1 px-4 rounded-lg text-sm"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>
          
          {showDebug && (
            <div className="mt-4 bg-black bg-opacity-80 p-4 rounded text-white text-xs font-mono max-w-md text-left">
              <p>Room ID: {roomId}</p>
              <p>Player ID: {playerId}</p>
              <p>Socket Connected: {socket?.connected ? "Yes" : "No"}</p>
              <p>Socket ID: {socket?.id || "None"}</p>
              <p>Teams Loaded: Player ({hasPlayerPokemon ? "Yes" : "No"}), Opponent ({hasOpponentPokemon ? "Yes" : "No"})</p>
              <p>Connection Status: {connectionStatus}</p>
              <p>Connection Attempts: {connectionAttempt}</p>
              
              <div className="mt-2">
                <p>Battle State Summary:</p>
                <pre className="mt-1 overflow-auto max-h-40">
                  {JSON.stringify(getStateSummary(), null, 2)}
                </pre>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={forceRetry}
                  className="bg-blue-500 text-white py-1 px-2 rounded text-xs"
                >
                  Retry
                </button>
                <button 
                  onClick={goToTeamSelection}
                  className="bg-gray-500 text-white py-1 px-2 rounded text-xs"
                >
                  Team Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const isPlayer1 = battleState.player1.id === playerId;
  const playerTeam = isPlayer1 ? battleState.player1.team : battleState.player2.team;
  const opponentTeam = isPlayer1 ? battleState.player2.team : battleState.player1.team;
  const playerActivePokemon = isPlayer1 ? battleState.player1.activePokemon : battleState.player2.activePokemon;
  const opponentActivePokemon = isPlayer1 ? battleState.player2.activePokemon : battleState.player1.activePokemon;
  const playerPokemon = playerTeam[playerActivePokemon];
  const opponentPokemon = opponentTeam[opponentActivePokemon];

  console.log("POKEMON DISPLAY INFO:", {
    isPlayer1,
    playerTeamId: isPlayer1 ? "player1" : "player2",
    opponentTeamId: isPlayer1 ? "player2" : "player1",
    playerTeamSize: playerTeam.length,
    opponentTeamSize: opponentTeam.length,
    playerActivePokemon,
    opponentActivePokemon,
    playerPokemonName: playerPokemon?.name,
    opponentPokemonName: opponentPokemon?.name,
    playerSpriteFront: playerPokemon?.sprites?.front,
    playerSpriteBack: playerPokemon?.sprites?.back,
    opponentSpriteFront: opponentPokemon?.sprites?.front,
    opponentSpriteBack: opponentPokemon?.sprites?.back,
    playerPokemonHP: playerPokemon?.currentHp,
    opponentPokemonHP: opponentPokemon?.currentHp
  });

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden bg-battle-arena">
      <AudioPlayer src="/audio/battle.mp3" loop={true} />

      {/* Background Particles */}
      <BattleParticles count={50} />

      {/* Top HUD Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Left: Settings & Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="group relative w-12 h-12 rounded-xl bg-gray-800/80 border-2 border-gray-700 hover:border-blue-500 transition-all hover:scale-110"
            >
              <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
              <span className="relative text-2xl">⚙️</span>
            </button>

            <button
              onClick={() => setShowForfeitConfirm(true)}
              className="group relative px-4 py-2 rounded-lg bg-red-500/20 border-2 border-red-500/50 hover:bg-red-500/30 hover:border-red-500 transition-all"
            >
              <span className="font-tech text-sm text-red-400 group-hover:text-red-300">
                🏳️ FORFEIT
              </span>
            </button>

            <button
              onClick={() => setShowBattleLog(!showBattleLog)}
              className="md:hidden px-4 py-2 rounded-lg bg-gray-800/80 border-2 border-gray-700 hover:border-yellow-500 transition-all"
            >
              <span className="font-tech text-sm text-yellow-500">
                📜 LOG
              </span>
            </button>
          </div>

          {/* Center: Room Info */}
          <div className="hidden md:flex items-center gap-3 px-6 py-2 bg-gray-900/80 rounded-full border border-gray-700">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-tech text-xs text-gray-400">ROOM:</span>
            <span className="font-tech text-sm text-white tracking-wider">{roomId}</span>
          </div>

          {/* Right: Turn Indicator */}
          <div className={`px-6 py-2 rounded-full border-2 transition-all ${
            isMyTurn
              ? 'bg-green-500/20 border-green-500 animate-pulse-glow'
              : 'bg-gray-800/80 border-gray-700'
          }`}>
            <div className="flex items-center gap-2">
              {isMyTurn ? (
                <>
                  <span className="text-xl animate-bounce">⚔️</span>
                  <span className="font-display font-bold text-green-400">YOUR TURN</span>
                </>
              ) : (
                <>
                  <span className="text-xl">⏳</span>
                  <span className="font-display font-bold text-gray-400">OPPONENT'S TURN</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowSettings(false)}
          ></div>

          <div className="relative z-10 w-full max-w-md animate-scale-in">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-gray-700 shadow-2xl overflow-hidden">
              
              <div className="relative p-6 border-b border-gray-700">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-yellow-500 to-blue-500"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⚙️</span>
                    <h2 className="text-2xl font-display font-bold text-white">
                      BATTLE SETTINGS
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-xl transition-all hover:rotate-90"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎵</span>
                    <div>
                      <p className="font-display font-bold text-white">Battle Music</p>
                      <p className="text-xs text-gray-400 font-tech">Background music during battle</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMusicEnabled(!musicEnabled)
                      if (audioRef.current) {
                        musicEnabled ? audioRef.current.pause() : audioRef.current.play()
                      }
                    }}
                    className={`relative w-16 h-8 rounded-full transition-all ${
                      musicEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      musicEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔊</span>
                    <div>
                      <p className="font-display font-bold text-white">Sound Effects</p>
                      <p className="text-xs text-gray-400 font-tech">Move and UI sounds</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative w-16 h-8 rounded-full transition-all ${
                      soundEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      soundEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <div>
                      <p className="font-display font-bold text-white">Battle Animations</p>
                      <p className="text-xs text-gray-400 font-tech">Show move effects</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAnimationsEnabled(!animationsEnabled)}
                    className={`relative w-16 h-8 rounded-full transition-all ${
                      animationsEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      animationsEnabled ? 'translate-x-9' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-4"></div>

                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <p className="font-tech text-xs text-blue-400 mb-2">BATTLE INFO</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">Room: <span className="text-white font-mono">{roomId}</span></p>
                    <p className="text-gray-300">Player: <span className="text-white">{playerId}</span></p>
                    <p className="text-gray-300">Format: <span className="text-white">6v6 Singles</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowBattleLog(!showBattleLog)
                      setShowSettings(false)
                    }}
                    className="px-4 py-3 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl hover:bg-yellow-500/30 transition-all font-display font-bold text-yellow-500"
                  >
                    📜 BATTLE LOG
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(false)
                      setShowForfeitConfirm(true)
                    }}
                    className="px-4 py-3 bg-red-500/20 border-2 border-red-500/50 rounded-xl hover:bg-red-500/30 transition-all font-display font-bold text-red-400"
                  >
                    🏳️ FORFEIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bag Modal */}
      {showBagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBagModal(false)}
          ></div>

          <div className="relative z-10 w-full max-w-2xl animate-scale-in">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-yellow-500 shadow-2xl overflow-hidden">
              
              <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-yellow-600 to-orange-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🎒</span>
                    <h2 className="text-2xl font-display font-bold text-white">YOUR BAG</h2>
                  </div>
                  <button
                    onClick={() => setShowBagModal(false)}
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-12 text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-6xl opacity-30">🎒</span>
                </div>
                
                <h3 className="text-2xl font-display font-bold text-white mb-3">
                  BAG IS EMPTY
                </h3>
                <p className="text-gray-400 font-body mb-2">
                  Items cannot be used in PvP battles
                </p>
                <p className="text-sm text-gray-500 font-tech">
                  Focus on strategy and move selection to win!
                </p>

                <button
                  onClick={() => setShowBagModal(false)}
                  className="mt-8 px-8 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-display font-bold text-white transition-all"
                >
                  GOT IT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRunModal(false)}
          ></div>

          <div className="relative z-10 w-full max-w-md animate-shake">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-red-500 shadow-2xl overflow-hidden">
              
              <div className="p-6 bg-gradient-to-r from-red-600 to-red-800">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">🚫</span>
                  <h2 className="text-2xl font-display font-bold text-white">CAN'T RUN!</h2>
                </div>
              </div>

              <div className="p-8 text-center">
                <p className="text-xl text-white font-body mb-4">
                  You can't run from a PvP trainer battle!
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Fight until the end or use forfeit to surrender
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRunModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-display font-bold text-white transition-all"
                  >
                    BACK TO BATTLE
                  </button>
                  <button
                    onClick={() => {
                      setShowRunModal(false)
                      setShowForfeitConfirm(true)
                    }}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-display font-bold text-white transition-all"
                  >
                    FORFEIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit Confirmation Modal */}
      {showForfeitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowForfeitConfirm(false)}
          ></div>

          <div className="relative z-10 w-full max-w-md animate-scale-in">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-4 border-red-500 shadow-2xl overflow-hidden">
              
              <div className="h-2 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse"></div>
              
              <div className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-6xl">🏳️</span>
                </div>
                
                <h2 className="text-3xl font-display font-black text-white mb-4">
                  FORFEIT BATTLE?
                </h2>
                <p className="text-gray-300 font-body text-lg mb-2">
                  Are you sure you want to surrender?
                </p>
                <p className="text-red-400 text-sm font-tech mb-8">
                  This will count as a loss
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowForfeitConfirm(false)}
                    className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-display font-bold text-white transition-all hover:scale-105"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => {
                      socket?.emit('forfeitBattle', { roomId, playerId })
                      setShowForfeitConfirm(false)
                    }}
                    className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 rounded-xl font-display font-bold text-white transition-all hover:scale-105"
                  >
                    FORFEIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Victory/Defeat Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0">
            <div className={`absolute inset-0 ${
              winner === 'You' 
                ? 'bg-gradient-to-br from-yellow-500/30 via-green-500/30 to-blue-500/30'
                : 'bg-gradient-to-br from-red-500/30 via-purple-500/30 to-gray-500/30'
            } animate-gradient-battle-shift`}></div>
            <div className="absolute inset-0 backdrop-blur-xl"></div>
            
            {winner === 'You' && <ConfettiEffect />}
          </div>

          <div className="relative z-10 w-full max-w-2xl animate-scale-in-big">
            <div className={`rounded-3xl border-4 shadow-2xl overflow-hidden ${
              winner === 'You'
                ? 'border-yellow-400 bg-gradient-to-br from-yellow-900/95 to-green-900/95'
                : 'border-red-500 bg-gradient-to-br from-red-900/95 to-gray-900/95'
            }`}>
              
              <div className={`h-3 ${
                winner === 'You'
                  ? 'bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400'
                  : 'bg-gradient-to-r from-red-600 via-purple-600 to-gray-600'
              } animate-shimmer`}></div>

              <div className="p-12 text-center">
                
                <div className="relative mb-8">
                  <div className={`absolute inset-0 ${
                    winner === 'You' ? 'bg-yellow-400/30' : 'bg-red-500/30'
                  } blur-3xl animate-pulse-slow`}></div>
                  
                  <div className="relative">
                    {winner === 'You' ? (
                      <div className="animate-bounce-big">
                        <span className="text-9xl">🏆</span>
                      </div>
                    ) : (
                      <div className="animate-shake-slow">
                        <span className="text-9xl">💔</span>
                      </div>
                    )}
                  </div>
                </div>

                <h1 className={`text-6xl font-display font-black mb-4 ${
                  winner === 'You'
                    ? 'text-yellow-300'
                    : 'text-red-400'
                }`}>
                  {winner === 'You' ? 'VICTORY!' : 'DEFEAT'}
                </h1>

                <p className={`text-2xl font-body mb-8 ${
                  winner === 'You' ? 'text-yellow-200' : 'text-gray-300'
                }`}>
                  {winner === 'You' 
                    ? `You won with ${remainingPokemon} Pokémon remaining!`
                    : `Opponent won with ${remainingPokemon} Pokémon remaining`
                  }
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl mx-auto">
                  <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                    <p className="text-3xl font-bold text-white mb-1">{remainingPokemon}</p>
                    <p className="text-xs text-gray-400 font-tech">POKÉMON LEFT</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                    <p className="text-3xl font-bold text-white mb-1">{battleLog.length}</p>
                    <p className="text-xs text-gray-400 font-tech">TOTAL TURNS</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                    <p className="text-3xl font-bold text-white mb-1">6v6</p>
                    <p className="text-xs text-gray-400 font-tech">FORMAT</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleRematchSameTeam}
                    className="group relative w-full overflow-hidden rounded-2xl transition-all hover:scale-105"
                  >
                    <div className={`absolute inset-0 ${
                      winner === 'You'
                        ? 'bg-gradient-to-r from-green-600 to-green-800'
                        : 'bg-gradient-to-r from-blue-600 to-blue-800'
                    }`}></div>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative px-8 py-4 flex items-center justify-center gap-3">
                      <span className="text-2xl">🔄</span>
                      <span className="font-display font-bold text-xl text-white">
                        REMATCH WITH SAME TEAM
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleRematchNewTeam}
                    className="group relative w-full overflow-hidden rounded-2xl transition-all hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800"></div>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative px-8 py-4 flex items-center justify-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <span className="font-display font-bold text-xl text-white">
                        REMATCH WITH NEW TEAM
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleGoHome}
                    className="group relative w-full overflow-hidden rounded-2xl transition-all hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-800"></div>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative px-8 py-4 flex items-center justify-center gap-3">
                      <span className="text-2xl">🏠</span>
                      <span className="font-display font-bold text-xl text-white">
                        RETURN TO LOBBY
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className={`h-3 ${
                winner === 'You'
                  ? 'bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400'
                  : 'bg-gradient-to-r from-gray-600 via-purple-600 to-red-600'
              }`}></div>
            </div>
          </div>
        </div>
      )}

      {/* Battle Log Drawer */}
      <div className={`fixed left-0 top-16 bottom-0 w-80 z-30 transition-transform duration-300 ${
        showBattleLog ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="h-full bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-r-2 border-gray-700 flex flex-col">
          
          <div className="p-4 border-b-2 border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <h3 className="font-display font-bold text-white text-lg">BATTLE LOG</h3>
            </div>
            <button
              onClick={() => setShowBattleLog(false)}
              className="md:hidden w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-lg"
            >
              ✕
            </button>
          </div>

          <div 
            ref={battleLogRef}
            className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
          >
            {battleLog.map((log, index) => {
              const isDamage = log.includes('damage') || log.includes('dealt')
              const isCritical = log.includes('critical')
              const isEffective = log.includes('effective')
              const isFainted = log.includes('fainted')
              const isTurn = log.includes('turn') || log.includes('Your turn') || log.includes("Opponent's turn")
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm font-body animate-fade-in ${
                    isFainted ? 'bg-red-500/20 border-l-4 border-red-500 text-red-200' :
                    isCritical ? 'bg-orange-500/20 border-l-4 border-orange-500 text-orange-200' :
                    isEffective ? 'bg-blue-500/20 border-l-4 border-blue-500 text-blue-200' :
                    isDamage ? 'bg-yellow-500/20 border-l-4 border-yellow-500 text-yellow-200' :
                    isTurn ? 'bg-green-500/20 border-l-4 border-green-500 text-green-200' :
                    'bg-gray-800/50 border-l-4 border-gray-600 text-gray-300'
                  }`}
                >
                  <p>{log}</p>
                </div>
              )
            })}
          </div>

          <div className="p-4 border-t-2 border-gray-700">
            <button
              onClick={() => setBattleLog(['Battle started...'])}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-tech text-sm text-gray-400 hover:text-white transition-all"
            >
              CLEAR LOG
            </button>
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className={`flex-1 relative overflow-hidden pt-16 min-h-0 transition-all duration-300 ${
        showBattleLog ? 'md:ml-80' : 'ml-0'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-purple-900 to-green-900"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-800/50 to-transparent"></div>

        <div className="relative h-full container mx-auto px-4 py-8 md:py-12">
          <div className="h-full flex flex-col justify-between gap-8">
            
            {/* Opponent's Pokemon - Top */}
            {opponentPokemon && (
              <div className="flex justify-end items-start gap-6 animate-slide-in-top">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-blue-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-blue-400/50 p-4 min-w-[280px] shadow-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-display font-bold text-white">
                          {formatPokemonName(opponentPokemon.name)}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          {opponentPokemon.types.map((type, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded font-tech uppercase"
                              style={{
                                backgroundColor: `var(--color-${type})`,
                                color: ['electric', 'ice', 'fairy', 'normal'].includes(type) ? '#000' : '#fff'
                              }}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-tech text-xs text-gray-400">LV</span>
                        <span className="font-tech text-2xl font-bold text-white ml-1">100</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-tech text-xs text-gray-400">HP</span>
                        <span className="font-tech text-xs text-white">
                          {opponentPokemon.currentHp} / {opponentPokemon.stats.hp}
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                        <div 
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${Math.max(0, (opponentPokemon.currentHp / opponentPokemon.stats.hp) * 100)}%`,
                            backgroundColor: 
                              opponentPokemon.currentHp < opponentPokemon.stats.hp * 0.2 ? '#EF4444' :
                              opponentPokemon.currentHp < opponentPokemon.stats.hp * 0.5 ? '#F59E0B' :
                              '#22C55E'
                          }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="text-right">
                        <span className={`font-tech text-xs font-bold ${
                          opponentPokemon.currentHp < opponentPokemon.stats.hp * 0.2 ? 'text-red-400' :
                          opponentPokemon.currentHp < opponentPokemon.stats.hp * 0.5 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {Math.round((opponentPokemon.currentHp / opponentPokemon.stats.hp) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/30 rounded-full blur-md"></div>
                  
                  <div className="relative">
                    <Image
                      src="/disk.png"
                      alt="Platform"
                      width={110}
                      height={40}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-60"
                    />
                    
                    <div className="relative animate-float-pokemon">
                      <div className={damageFlash ? 'animate-damage-shake' : ''}>
                        {opponentPokemon.currentHp < opponentPokemon.stats.hp * 0.2 && (
                          <div className="absolute -inset-4 bg-red-500/30 blur-xl animate-pulse-fast"></div>
                        )}
                        
                        <Image
                          src={opponentPokemon.sprites?.front || `/placeholder.svg`}
                          alt={opponentPokemon.name}
                          width={128}
                          height={128}
                          className="relative object-contain pixelated drop-shadow-2xl"
                          unoptimized
                          style={{
                            filter: opponentPokemon.currentHp <= 0 ? 'grayscale(100%)' : 'none',
                            opacity: opponentPokemon.currentHp <= 0 ? 0.5 : 1
                          }}
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg`;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Player's Pokemon - Bottom */}
            {playerPokemon && (
              <div className="flex justify-start items-end gap-6 animate-slide-in-bottom">
                <div className="relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/30 rounded-full blur-md"></div>
                  
                  <div className="relative">
                    <Image
                      src="/disk.png"
                      alt="Platform"
                      width={110}
                      height={40}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-60"
                    />
                    
                    <div className="relative animate-float-pokemon animation-delay-500">
                      <div className={damageFlash ? 'animate-damage-shake' : ''}>
                        {playerPokemon.currentHp < playerPokemon.stats.hp * 0.2 && (
                          <div className="absolute -inset-4 bg-red-500/30 blur-xl animate-pulse-fast"></div>
                        )}
                        
                        <Image
                          src={playerPokemon.sprites?.back || `/placeholder.svg`}
                          alt={playerPokemon.name}
                          width={128}
                          height={128}
                          className="relative object-contain pixelated drop-shadow-2xl"
                          unoptimized
                          style={{
                            filter: playerPokemon.currentHp <= 0 ? 'grayscale(100%)' : 'none',
                            opacity: playerPokemon.currentHp <= 0 ? 0.5 : 1
                          }}
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg`;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-2 bg-orange-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border-2 border-orange-400/50 p-4 min-w-[320px] shadow-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-display font-bold text-white">
                          {formatPokemonName(playerPokemon.name)}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          {playerPokemon.types.map((type, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded font-tech uppercase"
                              style={{
                                backgroundColor: `var(--color-${type})`,
                                color: ['electric', 'ice', 'fairy', 'normal'].includes(type) ? '#000' : '#fff'
                              }}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-tech text-xs text-gray-400">LV</span>
                        <span className="font-tech text-2xl font-bold text-white ml-1">100</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-tech text-xs text-gray-400">HP</span>
                        <span className="font-tech text-xs text-white">
                          {playerPokemon.currentHp} / {playerPokemon.stats.hp}
                        </span>
                      </div>
                      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                        <div 
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${Math.max(0, (playerPokemon.currentHp / playerPokemon.stats.hp) * 100)}%`,
                            backgroundColor: 
                              playerPokemon.currentHp < playerPokemon.stats.hp * 0.2 ? '#EF4444' :
                              playerPokemon.currentHp < playerPokemon.stats.hp * 0.5 ? '#F59E0B' :
                              '#22C55E'
                          }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="text-right">
                        <span className={`font-tech text-sm font-bold ${
                          playerPokemon.currentHp < playerPokemon.stats.hp * 0.2 ? 'text-red-400 animate-pulse' :
                          playerPokemon.currentHp < playerPokemon.stats.hp * 0.5 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {Math.round((playerPokemon.currentHp / playerPokemon.stats.hp) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-gray-800/50 rounded">
                        <p className="text-gray-400 font-tech mb-1">ATK</p>
                        <p className="text-white font-bold">{playerPokemon.stats.attack}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-800/50 rounded">
                        <p className="text-gray-400 font-tech mb-1">DEF</p>
                        <p className="text-white font-bold">{playerPokemon.stats.defense}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-800/50 rounded">
                        <p className="text-gray-400 font-tech mb-1">SPD</p>
                        <p className="text-white font-bold">{playerPokemon.stats.speed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="relative z-30 bg-gradient-to-t from-gray-900 via-gray-900/98 to-transparent backdrop-blur-xl border-t-2 border-gray-800">
        <div className="container mx-auto px-4 py-6">
          
          {/* Main Action Menu */}
          {!showMoveSelection && !showSwitchSelection && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto controls-grid">
                
                <button
                  onClick={() => setShowMoveSelection(true)}
                  disabled={!isMyTurn || playerPokemon.currentHp <= 0}
                  className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800"></div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <div className="relative px-8 py-6 flex flex-col items-center gap-2">
                    <span className="text-4xl animate-pulse-subtle">⚔️</span>
                    <span className="font-display font-bold text-xl text-white tracking-wide">FIGHT</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowSwitchSelection(true)}
                  className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800"></div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <div className="relative px-8 py-6 flex flex-col items-center gap-2">
                    <span className="text-4xl animate-pulse-subtle">🔄</span>
                    <span className="font-display font-bold text-xl text-white tracking-wide">POKÉMON</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowBagModal(true)}
                  className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-yellow-800"></div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <div className="relative px-8 py-6 flex flex-col items-center gap-2">
                    <span className="text-4xl animate-pulse-subtle">🎒</span>
                    <span className="font-display font-bold text-xl text-white tracking-wide">BAG</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowRunModal(true)}
                  className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800"></div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <div className="relative px-8 py-6 flex flex-col items-center gap-2">
                    <span className="text-4xl animate-pulse-subtle">🏃</span>
                    <span className="font-display font-bold text-xl text-white tracking-wide">RUN</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Move Selection Panel */}
          {showMoveSelection && playerPokemon.moves && (
            <div className="animate-slide-up">
              <button
                onClick={() => setShowMoveSelection(false)}
                className="mb-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-display text-white transition-all"
              >
                ← BACK
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {playerPokemon.moves.map((move, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleUseMove(move)
                      setShowMoveSelection(false)
                    }}
                    disabled={!isMyTurn}
                    className="group relative overflow-hidden rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <div 
                      className="absolute inset-0"
                      style={{ backgroundColor: `var(--color-${move.type})` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    
                    <div className="relative p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-left">
                          <h3 className="font-display font-bold text-xl text-white mb-1">
                            {move.name}
                          </h3>
                          <span className="inline-block px-3 py-1 bg-black/30 rounded-full text-xs font-tech text-white uppercase">
                            {move.type}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-tech text-sm text-white/80">PWR</p>
                          <p className="font-bold text-2xl text-white">
                            {move.power || '--'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-white/90 font-tech">
                        <span>ACC: {move.accuracy || '--'}%</span>
                        <span>{move.damageClass?.toUpperCase() || 'STATUS'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pokemon Switch Panel */}
          {showSwitchSelection && (
            <div className="animate-slide-up">
              <button
                onClick={() => setShowSwitchSelection(false)}
                className="mb-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-display text-white transition-all"
              >
                ← BACK
              </button>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-6xl mx-auto">
                {playerTeam.map((pokemon, index) => {
                  const isActive = playerActivePokemon === index
                  const isFainted = pokemon.currentHp <= 0
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isFainted && !isActive) {
                          handleSwitchPokemon(index)
                          setShowSwitchSelection(false)
                        }
                      }}
                      disabled={isFainted || isActive}
                      className={`group relative overflow-hidden rounded-2xl transition-all ${
                        !isFainted && !isActive ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'
                      }`}
                    >
                      <div className={`absolute inset-0 ${
                        isActive ? 'bg-gradient-to-br from-green-600 to-green-800' :
                        isFainted ? 'bg-gradient-to-br from-gray-700 to-gray-900' :
                        'bg-gradient-to-br from-blue-600 to-blue-800'
                      }`}></div>
                      
                      {isActive && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center z-10 animate-pulse">
                          <span className="text-sm">⭐</span>
                        </div>
                      )}
                      
                      <div className="relative p-4">
                        <div className="w-20 h-20 mx-auto mb-2 relative">
                          <Image
                            src={pokemon.sprites?.icon || `/sprites/${pokemon.id}_icon.png`}
                            alt={pokemon.name}
                            width={80}
                            height={80}
                            className={`w-full h-full object-contain pixelated ${
                              isFainted ? 'grayscale opacity-50' : ''
                            }`}
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.src = `/placeholder.svg`;
                            }}
                          />
                        </div>
                        
                        <p className={`font-tech text-sm text-center mb-2 truncate ${
                          isFainted ? 'text-gray-400' : 'text-white'
                        }`}>
                          {formatPokemonName(pokemon.name)}
                        </p>
                        
                        <div className="relative h-2 bg-black/30 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all"
                            style={{
                              width: `${(pokemon.currentHp / pokemon.stats.hp) * 100}%`,
                              backgroundColor:
                                pokemon.currentHp < pokemon.stats.hp * 0.2 ? '#EF4444' :
                                pokemon.currentHp < pokemon.stats.hp * 0.5 ? '#F59E0B' :
                                '#22C55E'
                            }}
                          ></div>
                        </div>
                        
                        <p className={`text-xs font-tech text-center mt-2 ${
                          isActive ? 'text-yellow-300' :
                          isFainted ? 'text-red-400' :
                          'text-gray-300'
                        }`}>
                          {isActive ? 'IN BATTLE' : isFainted ? 'FAINTED' : `${pokemon.currentHp} HP`}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute top-20 left-0 right-0 mx-auto max-w-md bg-red-100 text-red-600 p-3 rounded-lg text-center z-40">
          {error}
        </div>
      )}

      {/* Debug panel */}
      {showDebug && (
        <div className="absolute top-20 right-2 bg-black bg-opacity-80 p-3 rounded text-white text-xs font-mono z-50 max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Panel</h3>
            <button onClick={toggleDebug} className="text-gray-400 hover:text-white">×</button>
          </div>
          <p>Room: {roomId}</p>
          <p>Player: {playerId}</p>
          <p>Socket: {socket?.connected ? "Connected" : "Disconnected"}</p>
          <p>Turn: {isMyTurn ? "Yours" : "Opponent's"}</p>
          <div className="mt-2 space-y-1">
            <button 
              onClick={forceRetry}
              className="bg-blue-800 text-white py-0.5 px-2 rounded text-xs w-full"
            >
              Force Reconnect
            </button>
            <button 
              onClick={goToTeamSelection}
              className="bg-gray-700 text-white py-0.5 px-2 rounded text-xs w-full"
            >
              Back to Team Selection
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 z-50">
        <button 
          onClick={toggleDebug}
          className="bg-gray-800 bg-opacity-80 text-white text-xs py-1 px-2 rounded"
        >
          {showDebug ? "Hide Debug" : "Debug"}
        </button>
      </div>
    </main>
  )
}
