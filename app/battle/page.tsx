"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import HealthBar from "@/components/HealthBar"
import MoveButton from "@/components/MoveButton"
import AudioPlayer from "@/components/AudioPlayer"
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
  const mobileBattleLogRef = useRef<HTMLDivElement>(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [remainingPokemon, setRemainingPokemon] = useState(0)

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!roomId || !playerId) {
      console.log("Missing roomId or playerId, redirecting to home");
      router.push("/")
      return
    }

    console.log(`%c BATTLE PAGE LOADED`, 'background: #00ff00; color: black; font-size: 20px');
    console.log(`Room ID: ${roomId}, Player ID: ${playerId}`);

    // Track if we've attempted to join battle room
    let joinedBattleRoom = false;
    let connectionAttempts = 0;
    const MAX_CONNECTION_ATTEMPTS = 3;

    // Create socket connection if needed
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
      
      // Log connection events in detail
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

    // Cleanup function to be called when component unmounts
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

    // Handle connection events
    socket?.on("connect", () => {
      console.log(`%c SOCKET CONNECTED IN BATTLE PAGE: ${socket?.id}`, 'background: #00ff00; color: black; font-size: 16px');
      
      // Only join battle room if we haven't already
      if (!joinedBattleRoom && socket) {
        console.log(`%c ATTEMPTING TO JOIN BATTLE ROOM - roomId:${roomId}, playerId:${playerId}`, 'background: #ff00ff; color: white; font-size: 16px');
        socket.emit("joinBattleRoom", { roomId, playerId });
        joinedBattleRoom = true;
        connectionAttempts++;
        
        // Set a timeout to check if we've received a response
        setTimeout(() => {
          if (isLoading && battleState?.player1?.team?.length === 0) {
            console.warn("No battle state received after 5 seconds. Connection might have issues.");
            // This might help identify if the connection is stuck
            socket?.emit("ping", { timestamp: Date.now() });
          }
        }, 5000);
      }
    });

    // Handle reconnection
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
      
      // For certain disconnect reasons, try to reconnect manually
      if ((reason === "io server disconnect" || reason === "transport close") && socket) {
        // The server closed the connection, so we need to reconnect manually
        console.log("Attempting manual reconnection");
        socket.connect();
      }
    });

    // Set dummy battle state while loading
    setBattleState({
      player1: { team: [], activePokemon: 0 },
      player2: { team: [], activePokemon: 0 },
      turn: "player1",
      messages: []
    });
    
    addToBattleLog("Connecting to game server...");
    
    // Handle battle state update from server
    socket?.on("battleState", (state) => {
      console.log("%c Received battle state:", 'background: #00ff00; color: black; font-size: 16px');
      console.log(state);
      
      // Validate the state to make sure it has all necessary data
      const isValidState = state && 
                          state.player1 && state.player1.team && state.player1.team.length > 0 &&
                          state.player2 && state.player2.team && state.player2.team.length > 0;
      
      if (isValidState) {
        console.log("Battle state is valid, updating UI");
        setBattleState(state);
        addToBattleLog("Battle state received from server!");
        
        // Correctly set whose turn it is when first loading the battle
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

    // Handle battle update events
    socket.on("battleUpdate", (update: BattleUpdate) => {
      console.log("[BattlePage] Battle update received:", JSON.parse(JSON.stringify(update))); // Log a clean copy
      
      // Update battle log based on the type of update
      // This part should happen OUTSIDE setBattleState, as it just logs and plays sounds.
      switch (update.type) {
        case "moveUsed":
          addToBattleLog(`${update.attacker} used ${update.move}!`);
          if (update.move) playMoveSound(update.move);
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
        case "message": // Generic message from server
          if(update.message) addToBattleLog(update.message);
          break;
      }

      // Now, update the actual battle state
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

              // Determine which player is the defender based on the attacker
              // The defender is the one whose active Pokemon's name matches defenderNameFromServer
              // AND is NOT the attacker.

              const p1Active = newState.player1.team[newState.player1.activePokemon];
              const p2Active = newState.player2.team[newState.player2.activePokemon];

              if (p1Active && p1Active.name.toLowerCase() === defenderNameFromServerLower) {
                // Player1's active Pokemon matches the defender name from server
                // Now, ensure this is not the attacker hitting themselves (unless it's confusion, which we aren't handling yet)
                // For simplicity, we assume if P1's active is the defender name, and P2's active is the attacker, P1 is the true defender.
                if (p2Active && p2Active.name.toLowerCase() === attackerNameLower) { // P2 attacked P1
                    console.log(`  -> Updating P1 ${p1Active.name} HP: ${p1Active.currentHp} -> ${update.defenderHp}`);
                    p1Active.currentHp = update.defenderHp;
                    hpUpdated = true;
                } else if (!p2Active || p2Active.name.toLowerCase() !== attackerNameLower) {
                    // This case handles if P1 is the defender and P2 is not the attacker (e.g. P1 hit self, or log mismatch)
                    // Or if P1 is attacker AND defender (self-hit/confusion)
                    if (p1Active.name.toLowerCase() === attackerNameLower) { // P1 attacked P1 (self)
                        console.log(`  -> SELF HIT: Updating P1 ${p1Active.name} HP: ${p1Active.currentHp} -> ${update.defenderHp}`);
                        p1Active.currentHp = update.defenderHp;
                        hpUpdated = true;
                    } else {
                         console.warn(`  -> Ambiguous: P1 (${p1Active.name}) matches defender, but P2 (${p2Active?.name}) is not attacker (${attackerNameLower}). Assuming P1 is defender.`);
                         p1Active.currentHp = update.defenderHp; // Default to updating P1 if it matches defender name
                         hpUpdated = true;
                    }
                }
              } else if (p2Active && p2Active.name.toLowerCase() === defenderNameFromServerLower) {
                // Player2's active Pokemon matches the defender name from server
                if (p1Active && p1Active.name.toLowerCase() === attackerNameLower) { // P1 attacked P2
                    console.log(`  -> Updating P2 ${p2Active.name} HP: ${p2Active.currentHp} -> ${update.defenderHp}`);
                    p2Active.currentHp = update.defenderHp;
                    hpUpdated = true;
                } else if (!p1Active || p1Active.name.toLowerCase() !== attackerNameLower) {
                     // This case handles if P2 is the defender and P1 is not the attacker
                     // Or if P2 is attacker AND defender (self-hit/confusion)
                    if (p2Active.name.toLowerCase() === attackerNameLower) { // P2 attacked P2 (self)
                        console.log(`  -> SELF HIT: Updating P2 ${p2Active.name} HP: ${p2Active.currentHp} -> ${update.defenderHp}`);
                        p2Active.currentHp = update.defenderHp;
                        hpUpdated = true;
                    } else {
                        console.warn(`  -> Ambiguous: P2 (${p2Active.name}) matches defender, but P1 (${p1Active?.name}) is not attacker (${attackerNameLower}). Assuming P2 is defender.`);
                        p2Active.currentHp = update.defenderHp; // Default to updating P2 if it matches defender name
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
            if (update.pokemon && update.playerId) { // Expect playerId of the owner of the fainted pokemon
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
                  // Check benched Pokemon for the owner
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
    
    // Handle battle end event
    socket.on("battleEnd", ({ winner: winnerId, loser }) => {
      console.log("Battle ended:", winnerId, loser)
      
      const isWinner = winnerId === playerId
      
      // Improve logging to debug
      console.log("Battle end detected", {
        winnerId,
        playerId,
        isWinner,
        battleStateExists: !!battleState,
        playerTeamSize: battleState?.player1?.team?.length,
        opponentTeamSize: battleState?.player2?.team?.length
      });
      
      // Count remaining Pokémon - more robust version
      let pokemonLeft = 0;
      try {
        if (battleState) {
          // This was using the wrong player reference sometimes
          // - If player1 wins, we need player1's team
          // - If player2 wins, we need player2's team
          // But the code was assuming player1 is always the current player, which might not be true
          
          // Get the winner's team properly
          const winnerTeamKey = (battleState.player1.id === winnerId) ? 'player1' : 'player2';
          const winnerTeam = battleState[winnerTeamKey].team;
          
          console.log("Winner team data:", {
            teamKey: winnerTeamKey,
            teamExists: !!winnerTeam,
            teamSize: winnerTeam?.length
          });
          
          if (winnerTeam && Array.isArray(winnerTeam)) {
            pokemonLeft = winnerTeam.filter(p => p && p.currentHp > 0).length;
            
            // Force at least 1 if the winner has no Pokémon left (this would be a bug but ensures better UX)
            if (pokemonLeft === 0 && isWinner) {
              pokemonLeft = 1;
            }
          } else {
            console.error("Winner team not found in battle state");
            // Default to 1 for better UX
            pokemonLeft = isWinner ? 1 : 0;
          }
        } else {
          console.warn("No battle state available for winner calculation");
          // Default to 1 for better UX
          pokemonLeft = isWinner ? 1 : 0;
        }
      } catch (error) {
        console.error("Error calculating remaining Pokémon:", error);
        // Default to 1 for better UX
        pokemonLeft = isWinner ? 1 : 0;
      }
      
      if (winnerId === playerId) {
        addToBattleLog("You won the battle!")
      } else {
        addToBattleLog("You lost the battle!")
      }
      
      // Set game over state
      setWinner(isWinner ? "You" : "Opponent")
      setRemainingPokemon(pokemonLeft)
      setGameOver(true)
    })
    
    // Handle player disconnection status update
    socket.on("playerDisconnectedUpdate", ({ playerId: disconnectedPlayerId, roomId: eventRoomId, players }) => {
      if (eventRoomId !== roomId) return; // Ensure update is for this room
      
      console.log("Player disconnection update received:", { disconnectedPlayerId, players });
      addToBattleLog(`Player ${disconnectedPlayerId} connection status changed.`);
      
      // You might want to update the UI to show the opponent as disconnected
      // For now, we just log it. If the battle ends due to this, 
      // the subsequent 'battleEnd' event will handle redirection.
      
      // Example of updating opponent status visually (requires state)
      // setOpponentConnected(players[opponentId]?.connected);
    });
    
    // Listen for battle errors
    socket.on("battleError", (error) => {
      console.error("%c Battle error received:", 'background: #ff0000; color: white; font-size: 16px');
      console.error(error);
      setError(error.message || "An error occurred with the battle");
      addToBattleLog(`Error: ${error.message || "Connection issue"} (Code: ${error.code || 'UNKNOWN'})`);

      // Handle specific error codes
      if (error.code === 'BATTLE_NOT_STARTED' || 
          error.code === 'BATTLE_DATA_MISSING' || 
          error.code === 'BATTLE_DATA_INCOMPLETE') {
          
        console.log(`Battle initialization error (Code: ${error.code}), attempting to retry...`);
        
        // Show a helpful message in the battle log
        addToBattleLog("Battle initialization failed. Retrying...");
        addToBattleLog(`Attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS}...`);
        setConnectionStatus(`Initialization Error (${error.code}) - Retrying...`);

        // Try to join the battle room again if we haven't exceeded max attempts
        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
          console.log(`Retry attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS}`);
          
          setTimeout(() => {
            if (socket && socket.connected) {
              console.log("Retrying joinBattleRoom...");
              setConnectionAttempt(prev => prev + 1);
              socket.emit("joinBattleRoom", { roomId, playerId });
            }
          }, 3000); // Increased retry delay
        } else {
          console.log("Max retry attempts reached, stopping retries.");
          setIsLoading(false);
          setError(`Failed to initialize battle after multiple attempts (Code: ${error.code}). Please return to team selection or the main menu.`);
          addToBattleLog("Unable to join battle after multiple attempts.");
          addToBattleLog("Please use the buttons below to navigate.");
          setConnectionStatus(`Failed (Code: ${error.code})`);
          
          // Don't automatically redirect anymore, let the user decide via buttons
          // setTimeout(() => {
          //   window.location.href = `/team-selection?roomId=${roomId}&playerId=${playerId}`;
          // }, 5000);
        }
      } else if (error.code === 'INVALID_TEAM') {
        // Handle invalid team error - likely means user needs to reselect
        setIsLoading(false);
        setError("Your team is invalid. Please return to team selection.");
        addToBattleLog("Error: Invalid team detected by server.");
        setConnectionStatus("Failed (Invalid Team)");
      } else {
        // Generic error handling for other codes
        setIsLoading(false);
        setConnectionStatus(`Failed (Code: ${error.code || 'UNKNOWN'})`);
      }
    });
    
    // Return cleanup function
    return cleanup;
  }, [roomId, playerId, router])

  // Add this effect to auto-scroll the battle logs
  useEffect(() => {
    // Scroll desktop battle log
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
    
    // Scroll mobile battle log
    if (mobileBattleLogRef.current) {
      mobileBattleLogRef.current.scrollTop = mobileBattleLogRef.current.scrollHeight
    }
  }, [battleLog])

  // Helper function to add messages to the battle log
  const addToBattleLog = (message: string) => {
    setBattleLog(prev => [...prev, message])
  }
  
  // Play move sound effect
  const playMoveSound = (moveName: string) => {
    try {
      const audio = new Audio(`/audio/${moveName.toLowerCase().replace(" ", "-")}.wav`)
      audio.play().catch(err => console.error("Error playing sound:", err))
    } catch (error) {
      console.error("Error with sound effect:", error)
    }
  }

  // Handle using a move
  const handleUseMove = (move: Move) => {
    if (!battleState || !socket || !roomId || !playerId) return;
    
    // Log the move attempt
    console.log("Attempting to use move:", {
      move,
      isMyTurn,
      pokemonId: isPlayer1 ? battleState.player1.activePokemon : battleState.player2.activePokemon
    });
    
    // Check if it's player's turn
    if (!isMyTurn) {
      console.log("Cannot make move - not player's turn");
      addToBattleLog("It's not your turn yet!");
      return;
    }
    
    // Emit makeMove event with correct player perspective
    socket.emit("makeMove", {
      roomId,
      playerId,
      move,
      pokemonId: isPlayer1 ? battleState.player1.activePokemon : battleState.player2.activePokemon
    });
  }

  // Handle switching Pokémon
  const handleSwitchPokemon = (index: number) => {
    if (!battleState || !socket || !roomId || !playerId) return;
    
    const team = isPlayer1 ? battleState.player1.team : battleState.player2.team;
    const currentActive = isPlayer1 ? battleState.player1.activePokemon : battleState.player2.activePokemon;
    
    // Log the switch attempt
    console.log("Attempting to switch Pokémon:", {
      fromIndex: currentActive,
      toIndex: index,
      isMyTurn
    });
    
    // Don't allow switching to fainted Pokémon
    if (team.length <= index || team[index].currentHp <= 0) {
      console.log("Cannot switch to fainted Pokémon");
      addToBattleLog(`${formatPokemonName(team[index].name)} has fainted and cannot fight!`);
      return;
    }
    
    // Don't switch if already active
    if (currentActive === index) {
      console.log("Pokémon already active");
      addToBattleLog(`${formatPokemonName(team[index].name)} is already in battle!`);
      return;
    }
    
    // Check if active Pokémon has fainted (forced switch)
    const activePokemon = team[currentActive];
    const isForcedSwitch = activePokemon?.currentHp <= 0;
    
    // Check if most recent battle log suggests a forced switch is needed
    const recentLogs = battleLog.slice(-5); // Check last 5 log messages
    const switchRequiredInLog = recentLogs.some(log => 
      log.includes("Choose a new Pokémon") || 
      log.includes("fainted") && log.includes(formatPokemonName(activePokemon?.name || ""))
    );
    
    // Check if it's the first turn of the battle
    const isFirstTurn = battleLog.filter(log => log.includes("used")).length === 0;
    
    // Allow switching if:
    // 1. It's a forced switch (Pokémon fainted)
    // 2. It's the player's turn
    // 3. It's the first turn of the battle
    if (!isForcedSwitch && !switchRequiredInLog && !isMyTurn && !isFirstTurn) {
      console.log("Cannot switch - not player's turn (after first turn) and not a forced switch");
      addToBattleLog("It's not your turn to switch!");
      return;
    }
    
    // Emit switchPokemon event
    socket.emit("switchPokemon", {
      roomId,
      playerId,
      newPokemonId: team[index].id,
      isForcedSwitch: isForcedSwitch || switchRequiredInLog // Tell server this is a forced switch
    });
    
    // This is just for immediate feedback, the server will send the real update
    addToBattleLog(`Switching to ${formatPokemonName(team[index].name)}...`);
  }

  // Function to toggle debug panel
  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  }

  // Helper to get a summary of the battle state for debugging
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
        // Safely access additional properties that might not be in the type
        currentTurn: (battleState as any).currentTurn || "unknown"
      };
    } catch (e: any) {
      return `Error parsing battle state: ${e?.message || "Unknown error"}`;
    }
  }

  // Function to force a connection retry
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

  // Function to force redirect to team selection
  const goToTeamSelection = () => {
    window.location.href = `/team-selection?roomId=${roomId}&playerId=${playerId}`;
  }

  // Handle rematch with same team
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
  
  // Handle rematch with new team
  const handleRematchNewTeam = () => {
    if (!roomId || !playerId) return;
    
    // Redirect to team selection
    window.location.href = `/team-selection?roomId=${roomId}&playerId=${playerId}`;
  }
  
  // Handle go home
  const handleGoHome = () => {
    window.location.href = "/";
  }

  if (isLoading || !battleState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center battle-background">
        <h1 className="text-white text-2xl font-pokemon mb-4">Loading Battle...</h1>
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-red-600"></div>
        <p className="text-white mt-4 font-pokemon">Connecting to Socket.IO server...</p>
        <p className="text-white mt-2 font-pokemon text-sm">Connection status: {connectionStatus}</p>
        <p className="text-white mt-1 font-pokemon text-sm">Attempt: {connectionAttempt + 1}/3</p>
        
        {/* Debug controls */}
        <div className="mt-8 space-y-2">
          <button 
            onClick={forceRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white font-pokemon py-1 px-4 rounded-lg text-sm"
          >
            Force Retry
          </button>
          <button 
            onClick={goToTeamSelection}
            className="bg-gray-500 hover:bg-gray-600 text-white font-pokemon py-1 px-4 rounded-lg text-sm ml-2"
          >
            Return to Team Selection
          </button>
        </div>
      </div>
    )
  }

  // For rendering, we need to have at least some Pokémon data
  // This is a fallback for when the battle starts but we don't have data yet
  const hasPlayerPokemon = battleState.player1.team.length > 0
  const hasOpponentPokemon = battleState.player2.team.length > 0
  
  if (!hasPlayerPokemon || !hasOpponentPokemon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center battle-background">
        <h1 className="text-white text-2xl font-pokemon mb-4">Waiting for Battle Data...</h1>
        <div className="animate-bounce mb-4">
          <Image 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
            alt="Loading" 
            width={64} 
            height={64}
            unoptimized
          />
        </div>
        <p className="text-white mt-4 font-pokemon text-center max-w-md">
          Battle is starting soon. Waiting for player and opponent information.
          <br /><br />
          If this takes too long, try returning to the home page and reconnecting.
        </p>
        
        {/* Debug info */}
        <div className="mt-8">
          <button 
            onClick={toggleDebug}
            className="bg-gray-800 text-white font-pokemon py-1 px-4 rounded-lg text-sm"
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

  // Determine player and opponent Pokémon based on playerId
  const isPlayer1 = battleState.player1.id === playerId;

  // If current user is player1, use player1's team as playerTeam and player2's as opponentTeam
  // If current user is player2, use player2's team as playerTeam and player1's as opponentTeam
  const playerTeam = isPlayer1 ? battleState.player1.team : battleState.player2.team;
  const opponentTeam = isPlayer1 ? battleState.player2.team : battleState.player1.team;
  const playerActivePokemon = isPlayer1 ? battleState.player1.activePokemon : battleState.player2.activePokemon;
  const opponentActivePokemon = isPlayer1 ? battleState.player2.activePokemon : battleState.player1.activePokemon;

  // Get the active Pokémon for both players
  const playerPokemon = playerTeam[playerActivePokemon];
  const opponentPokemon = opponentTeam[opponentActivePokemon];

  // Debug logging
  console.log("POKEMON DISPLAY INFO:", {
    isPlayer1,
    playerTeamId: isPlayer1 ? "player1" : "player2",
    opponentTeamId: isPlayer1 ? "player2" : "player1",
    playerTeamSize: playerTeam.length,
    opponentTeamSize: opponentTeam.length,
    playerActivePokemon,
    opponentActivePokemon,
    playerPokemonName: playerPokemon?.name,
    opponentPokemonName: opponentPokemon?.name
  });

  return (
    <main className="min-h-screen battle-background flex flex-col">
      <AudioPlayer src="/audio/battle.mp3" loop={true} />

      {/* Debug button */}
      <div className="absolute top-2 right-2 z-50">
        <button 
          onClick={toggleDebug}
          className="bg-gray-800 bg-opacity-80 text-white text-xs py-1 px-2 rounded"
        >
          {showDebug ? "Hide Debug" : "Debug"}
        </button>
      </div>

      {/* Debug panel */}
      {showDebug && (
        <div className="absolute top-10 right-2 bg-black bg-opacity-80 p-3 rounded text-white text-xs font-mono z-50 max-w-xs">
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

      {error && (
        <div className="absolute top-4 left-0 right-0 mx-auto max-w-md bg-red-100 text-red-600 p-3 rounded-lg text-center z-40">
          {error}
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white border-4 border-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-pokemon text-center mb-4 text-gray-800">Battle Ended!</h2>
            
            <div className="text-center mb-6">
              <div className="text-xl font-pokemon mb-2">
                {winner === "You" ? "Victory!" : "Defeat!"}
              </div>
              <p className="font-pokemon text-gray-700">
                {winner} won with {remainingPokemon} Pokémon remaining!
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleRematchSameTeam}
                className="pokemon-button w-full mb-2 bg-blue-100 hover:bg-blue-200"
              >
                Rematch with Same Team
              </button>
              
              <button
                onClick={handleRematchNewTeam}
                className="pokemon-button w-full mb-2 bg-green-100 hover:bg-green-200"
              >
                Rematch with New Team
              </button>
              
              <button
                onClick={handleGoHome}
                className="pokemon-button w-full bg-red-100 hover:bg-red-200"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-row p-4">
        {/* Battle Log HUD - Left Side */}
        <div className="w-1/4 mr-4 hidden md:block">
          <div className="bg-white border-4 border-gray-800 rounded-lg shadow-lg h-[500px] flex flex-col">
            <div className="bg-red-600 p-2 text-white font-pokemon text-center border-b-4 border-gray-800">
              Battle Log
            </div>
            <div ref={battleLogRef} className="p-3 flex-grow overflow-y-auto bg-gray-100">
              <div className="font-pokemon text-sm space-y-2">
                {battleLog.map((log, index) => (
                  <p key={index} className="border-b border-gray-300 pb-1">{log}</p>
                ))}
              </div>
            </div>
            
            {/* Current Turn Indicator */}
            <div className={`p-2 text-center font-pokemon ${isMyTurn ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {isMyTurn ? 'Your Turn!' : "Opponent's Turn"}
            </div>
            </div>
          </div>

        {/* Main Battle Area - Center */}
        <div className="flex-1 flex flex-col">
          {/* Opponent's Pokémon */}
          {opponentPokemon && (
            <div className="mb-8 flex flex-col md:flex-row items-start">
              <div className="flex-1 flex flex-col items-start mb-4 md:mb-0">
                <div className="bg-white border-4 border-gray-800 rounded-lg p-3 mb-2 min-w-64">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="font-pokemon text-lg">{formatPokemonName(opponentPokemon.name)}</h2>
                    <span className="text-sm font-pokemon">Lv.100</span>
                  </div>
                  <HealthBar currentHp={opponentPokemon.currentHp} maxHp={opponentPokemon.stats.hp} />
                  <div className="text-right mt-1 text-sm font-pokemon">
                    {opponentPokemon.currentHp}/{opponentPokemon.stats.hp} HP
                  </div>
                  <div className="flex mt-1">
                    {opponentPokemon.types.map((type, index) => (
                      <span 
                        key={index} 
                        className="mr-1 px-2 py-0.5 text-xs font-pokemon rounded uppercase"
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
              </div>

              <div className="pokemon-enter h-32 relative flex flex-col items-center">
                <Image
                  src="/disk.png"
                  alt="Pokemon base disk"
                  width={110}
                  height={40}
                  className="absolute bottom-0 opacity-75"
                />
                <Image
                  src={opponentPokemon.sprites?.front || `/placeholder.svg`}
                  alt={opponentPokemon.name}
                  width={128}
                  height={128}
                  className="object-contain h-full w-auto relative z-10"
                  unoptimized
                  onError={(e) => {
                    // @ts-ignore - TypeScript doesn't know about currentTarget.onerror
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `/placeholder.svg`;
                  }}
                />
              </div>
            </div>
          )}

          {/* Mobile Battle Log (only visible on mobile) */}
          <div ref={mobileBattleLogRef} className="md:hidden bg-white bg-opacity-90 border-4 border-gray-800 rounded-lg p-3 mb-4 h-32 overflow-y-auto">
          <div className="font-pokemon text-sm">
            {battleLog.slice(-3).map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </div>

        {/* Player's Pokémon */}
          {playerPokemon && (
        <div className="mt-auto flex flex-col-reverse md:flex-row items-end">
              <div className="pokemon-enter h-32 relative flex flex-col items-center">
                <Image
                  src="/disk.png"
                  alt="Pokemon base disk"
                  width={110}
                  height={40}
                  className="absolute bottom-0 opacity-75"
                />
                <Image
                  src={playerPokemon.sprites?.back || `/placeholder.svg`}
                  alt={playerPokemon.name}
                  width={128}
                  height={128}
                  className="object-contain h-full w-auto relative z-10"
                  unoptimized
                  onError={(e) => {
                    // @ts-ignore - TypeScript doesn't know about currentTarget.onerror
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `/placeholder.svg`;
                  }}
                />
              </div>

          <div className="flex-1 flex flex-col items-end mb-4 md:mb-0">
                <div className="bg-white border-4 border-gray-800 rounded-lg p-3 mb-2 min-w-64">
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="font-pokemon text-lg">{formatPokemonName(playerPokemon.name)}</h2>
                    <span className="text-sm font-pokemon">Lv.100</span>
                  </div>
              <HealthBar currentHp={playerPokemon.currentHp} maxHp={playerPokemon.stats.hp} />
                  <div className="text-right mt-1 text-sm font-pokemon">
                    {playerPokemon.currentHp}/{playerPokemon.stats.hp} HP
                  </div>
                  <div className="flex mt-1">
                    {playerPokemon.types.map((type, index) => (
                      <span 
                        key={index} 
                        className="mr-1 px-2 py-0.5 text-xs font-pokemon rounded uppercase"
                        style={{ 
                          backgroundColor: `var(--color-${type})`,
                          color: ['electric', 'ice', 'fairy', 'normal'].includes(type) ? '#000' : '#fff'
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                  
                  {/* Stats preview (expand on hover) */}
                  <div className="mt-2 text-xs font-mono grid grid-cols-2 gap-x-2">
                    <div>ATK: {playerPokemon.stats.attack}</div>
                    <div>DEF: {playerPokemon.stats.defense}</div>
                    <div>SP.ATK: {playerPokemon.stats.specialAttack}</div>
                    <div>SP.DEF: {playerPokemon.stats.specialDefense}</div>
                    <div className="col-span-2">SPD: {playerPokemon.stats.speed}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 py-4 px-6 border-t-4 border-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* Tabs for different control options */}
          <div className="flex mb-4 border-b border-gray-600">
            <button 
              className={`px-4 py-2 font-pokemon text-white ${isMyTurn ? 'bg-red-600' : 'bg-gray-700'} rounded-t-lg mr-2`}
              disabled={!isMyTurn}
            >
              FIGHT
            </button>
            <button className="px-4 py-2 font-pokemon text-white bg-gray-700 rounded-t-lg mr-2">
              POKéMON
            </button>
            <button className="px-4 py-2 font-pokemon text-white bg-gray-700 rounded-t-lg mr-2" disabled>
              BAG
            </button>
            <button className="px-4 py-2 font-pokemon text-white bg-gray-700 rounded-t-lg" disabled>
              RUN
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Moves */}
            <div className="grid grid-cols-2 gap-3">
              {playerPokemon && playerPokemon.moves && playerPokemon.moves.length > 0 ? (
                playerPokemon.moves.map((move, index) => (
              <MoveButton
                key={index}
                move={move}
                    onClick={() => handleUseMove(move)}
                    disabled={!isMyTurn}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-300 p-4 border-2 border-dashed border-gray-600 rounded-lg">
                  No moves available
                </div>
              )}
          </div>

          {/* Team */}
            <div className="bg-white border-4 border-gray-800 rounded-lg p-4">
              <div className="mb-2 text-center">
                <span className="font-pokemon text-lg text-gray-800">Switch Pokémon</span>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-3">
            {playerTeam.map((pokemon, index) => (
              <div
                key={index}
                onClick={() => handleSwitchPokemon(index)}
                className={`
                      cursor-pointer rounded-full p-2 border-2 w-16 h-16 flex items-center justify-center
                      ${playerActivePokemon === index ? "border-yellow-400 bg-yellow-100" : "border-gray-300 bg-white"}
                      ${pokemon.currentHp <= 0 ? "opacity-50 grayscale" : "hover:bg-gray-100"}
                      transition-all duration-200 relative
                    `}
                    title={formatPokemonName(pokemon.name)}
              >
                <Image
                      src={pokemon.sprites?.icon || `/placeholder.svg`}
                  alt={pokemon.name}
                      width={40}
                      height={40}
                      className="object-contain w-10 h-10"
                      unoptimized
                      onError={(e) => {
                        // @ts-ignore - TypeScript doesn't know about currentTarget.onerror
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `/placeholder.svg`;
                      }}
                    />
                    {/* Small HP indicator */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                      <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ 
                            width: `${Math.max(0, Math.min(100, (pokemon.currentHp / pokemon.stats.hp) * 100))}%`,
                            backgroundColor: pokemon.currentHp < pokemon.stats.hp * 0.3 ? '#ef4444' : 
                                          pokemon.currentHp < pokemon.stats.hp * 0.5 ? '#f59e0b' : '#22c55e'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 py-2 text-center text-xs text-gray-400 font-pokemon">
        Fan-made project, not affiliated with Pokémon.
      </footer>
    </main>
  )
}
