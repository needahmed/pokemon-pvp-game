"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import PokemonCard from "@/components/PokemonCard"
import { PokemonCardSkeletonGrid } from "@/components/PokemonCardSkeleton"
import LoadingSpinner from "@/components/LoadingSpinner"
import SoundToggle from "@/components/SoundToggle"
import { CircuitBoardPattern } from "@/components/animations/CircuitBoardPattern"
import { HolographicGrid } from "@/components/animations/HolographicGrid"
import { ScanningBeams } from "@/components/animations/ScanningBeams"
import { DataParticles } from "@/components/animations/DataParticles"
import type { Pokemon } from "@/lib/types"
import { fetchAllPokemon, fetchPokemonDetails, formatPokemonName, fetchPokemonByNameOrId } from "@/lib/api"
import io, { Socket } from "socket.io-client"

// Reuse socket from the home page
let socket: Socket

export default function TeamSelection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get("roomId")
  const playerId = searchParams.get("playerId")

  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Pokemon[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [otherPlayers, setOtherPlayers] = useState<{id: string, ready: boolean, teamSubmitted: boolean}[]>([]);
  const [battleStarting, setBattleStarting] = useState(false);

  // Socket connection and event handlers setup
  useEffect(() => {
    // Check if we have the required parameters
    if (!roomId || !playerId) {
      setError("Missing room ID or player ID. Please return to the home page.");
      return;
    }

    console.log(`%c Team Selection Page - Setting up socket for ${playerId} in room ${roomId}`, 'background: #00ff00; color: black; font-size: 16px');
    
    // Initialize Socket.IO connection if not already connected
    if (!socket) {
      console.log("Initializing socket connection for team selection...");
      const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
      console.log(`Team Selection Socket URL: ${socketURL}`);
      socket = io(socketURL, {
        reconnectionAttempts: 5,
        timeout: 10000,
      });
    } else if (!socket.connected) {
      console.log("%c Reusing existing socket connection", 'background: #00ff00; color: black; font-size: 16px');
    }
    
    // Handle socket connection
    const handleConnect = () => {
      console.log("%c Socket Connected in Team Selection", 'background: #00ff00; color: black; font-size: 16px');
      console.log("Connected to server with id:", socket.id);
      
      // Join room when socket connects
      console.log(`%c Joining room ${roomId} as player ${playerId}`, 'background: #ff00ff; color: white; font-size: 16px');
      socket.emit("joinRoom", { roomId, playerId });
    };
    
    // Handle connection error
    const handleConnectError = (err: Error) => {
      console.error("Connection error:", err);
      setError("Failed to connect to server. Please try again.");
      setSubmitting(false);
    };
    
    // Handle start battle event
    const handleStartBattle = (data: any) => {
      console.log(`%c BATTLE STARTING EVENT RECEIVED`, 'background: #ff0000; color: white; font-size: 20px');
      console.log(`DATA:`, data);
      console.log(`Redirecting to: /battle?roomId=${roomId}&playerId=${playerId}`);
      setBattleStarting(true);
      
      setTimeout(() => {
        console.log("Executing redirect now...");
        window.location.href = `/battle?roomId=${roomId}&playerId=${playerId}`;
      }, 500);
    };
    
    // Handle forced redirect
    const handleForceRedirect = (data: any) => {
      console.log(`%c FORCE REDIRECT EVENT RECEIVED`, 'background: #ff0000; color: white; font-size: 20px');
      console.log(`DATA:`, data);
      setBattleStarting(true);
      
      setTimeout(() => {
        console.log("Executing force redirect now...");
        if (data && data.url) {
          console.log(`Redirecting to: ${data.url}`);
          window.location.href = data.url;
        } else {
          console.log(`Redirecting to: /battle?roomId=${roomId}&playerId=${playerId}`);
          window.location.href = `/battle?roomId=${roomId}&playerId=${playerId}`;
        }
      }, 500);
    };
    
    // Handle team status updates
    const handleTeamStatus = (data: any) => {
      console.log(`%c TEAM STATUS UPDATE RECEIVED`, 'background: #0000ff; color: white; font-size: 16px');
      console.log("Team status update:", data);
      
      if (data.players) {
        const others = Object.keys(data.players)
          .filter(id => id !== playerId)
          .map(id => ({
            id,
            ready: data.players[id].ready,
            teamSubmitted: data.players[id].teamSubmitted
          }));
        setOtherPlayers(others);
        
        const allSubmitted = Object.values(data.players).every((player: any) => player.teamSubmitted);
        if ((allSubmitted && Object.keys(data.players).length >= 2) || data.allSubmitted) {
          console.log("%c ALL PLAYERS HAVE SUBMITTED TEAMS - BATTLE SHOULD START SOON", 'background: #ff00ff; color: white; font-size: 16px');
          setBattleStarting(true);
        }
      }
    };
    
    // Register all event listeners
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("startBattle", handleStartBattle);
    socket.on("forceRedirect", handleForceRedirect);
    socket.on("teamStatus", handleTeamStatus);
    
    // If already connected, run the connect handler manually
    if (socket.connected) {
      handleConnect();
    }
    
    // Clean up listeners on unmount
    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("startBattle", handleStartBattle);
      socket.off("forceRedirect", handleForceRedirect);
      socket.off("teamStatus", handleTeamStatus);
    };
  }, [roomId, playerId]);

  // Search for Pokemon
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    
    const searchPokemon = async () => {
      try {
        if (!isNaN(Number(searchTerm))) {
          const pokemon = await fetchPokemonByNameOrId(searchTerm);
          if (pokemon) {
            setSearchResults(pokemon ? [pokemon as Pokemon] : []);
          } else {
            setSearchResults([]);
          }
        } else {
          const allPokemon = await fetchAllPokemon();
          const matches = allPokemon
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 10);
            
          if (matches.length > 0) {
            const pokemonDetails = await Promise.all(
              matches.map(p => fetchPokemonDetails(p.name))
            );
            setSearchResults(pokemonDetails.filter(p => p) as Pokemon[]);
          } else {
            setSearchResults([]);
          }
        }
      } catch (error) {
        console.error("Error searching for Pokémon:", error);
        setError("Failed to search for Pokémon. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      searchPokemon();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePokemonSelect = (pokemon: Pokemon) => {
    setSelectedPokemon((prev) => {
      const existingIndex = prev.findIndex(p => p.id === pokemon.id);
      if (existingIndex !== -1) {
        return prev.filter((_, index) => index !== existingIndex);
      }

      if (prev.length >= 6) {
        return prev;
      }

      return [...prev, pokemon];
    });
  }

  const handleSubmitTeam = () => {
    if (selectedPokemon.length !== 6) {
      setError("You must select exactly 6 Pokémon.");
      return;
    }
    
    if (!roomId || !playerId) {
      setError("Missing room ID or player ID.");
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    console.log("%c Submitting team to server...", 'background: #ff00ff; color: white; font-size: 16px');
    
    socket.emit("submitTeam", { 
      roomId, 
      playerId, 
      team: selectedPokemon
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-teal-950 relative overflow-hidden page-transition">
      {/* Animated circuit board pattern */}
      <CircuitBoardPattern />
      
      {/* Holographic grid */}
      <HolographicGrid />
      
      {/* Scanning beams */}
      <ScanningBeams />
      
      {/* Data particles */}
      <DataParticles count={100} />

      <div className="relative z-10 max-w-7xl mx-auto p-4">
        {/* Header Command Bar */}
        <div className="mb-6 relative">
          <div className="absolute -inset-px bg-gradient-to-r from-lab-primary via-lab-secondary to-lab-primary rounded-2xl opacity-50 blur-sm"></div>
          
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-lab-primary/50 p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-lab-primary to-lab-secondary rounded-lg flex items-center justify-center animate-pulse">
                  <span className="text-2xl">🔬</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-lab-primary to-lab-secondary">
                    POKEMON SELECTION LAB
                  </h1>
                  <p className="text-lab-primary font-tech text-xs tracking-wider">
                    &gt; TEAM BUILDER v3.0 • ROOM: {roomId}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 flex-wrap justify-center">
                {/* Team Counter */}
                <div className="px-6 py-3 bg-black/50 border-2 border-lab-primary rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-tech text-sm text-gray-400">TEAM:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            i < selectedPokemon.length
                              ? 'border-lab-primary bg-lab-primary/20 scale-110'
                              : 'border-gray-700 bg-gray-800/50'
                          }`}
                        >
                          {i < selectedPokemon.length ? (
                            <span className="text-xs text-lab-primary">✓</span>
                          ) : (
                            <span className="text-xs text-gray-600">{i + 1}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className={`font-tech text-xl font-bold ml-2 ${
                      selectedPokemon.length === 6
                        ? 'text-lab-primary animate-pulse'
                        : 'text-gray-400'
                    }`}>
                      {selectedPokemon.length}/6
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitTeam}
                  disabled={selectedPokemon.length !== 6 || submitting || battleStarting}
                  className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-lab-primary to-lab-secondary"></div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-30 transition-opacity"></div>
                  
                  {/* Scan line effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="scan-line-horizontal opacity-0 group-hover:opacity-100 group-hover:animate-scan-horizontal"></div>
                  </div>
                  
                  <div className="relative px-8 py-3 flex items-center gap-2">
                    <span className="text-xl">📡</span>
                    <span className="font-display font-bold text-lg text-gray-900">
                      {submitting ? 'UPLOADING...' : battleStarting ? 'STARTING...' : 'CONFIRM TEAM'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-lab-primary to-lab-secondary rounded-xl opacity-0 group-focus-within:opacity-50 blur transition-opacity"></div>
          
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-xl border border-lab-primary/30 overflow-hidden">
            <div className="flex items-center p-4">
              <span className="text-2xl mr-3">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Pokemon by name or ID (e.g., 'Pikachu' or '25')..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 font-body text-lg outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                >
                  CLEAR
                </button>
              )}
            </div>
            
            {isLoading && (
              <div className="h-1 bg-lab-primary animate-scan-horizontal"></div>
            )}
          </div>
        </div>

        {/* Selected Team Preview */}
        <div className="mb-6 relative">
          <div className="absolute -inset-px bg-gradient-to-r from-lab-secondary to-lab-primary rounded-2xl opacity-30 blur"></div>
          
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-lab-secondary/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display font-bold text-lab-secondary flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                YOUR SELECTED TEAM
              </h2>
              
              {selectedPokemon.length === 6 && (
                <div className="px-4 py-2 bg-lab-primary/20 border border-lab-primary rounded-lg animate-pulse">
                  <span className="font-tech text-lab-primary text-sm">✓ TEAM COMPLETE</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, index) => {
                const pokemon = selectedPokemon[index]
                
                return (
                  <div
                    key={index}
                    className={`relative group aspect-square ${
                      pokemon
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    }`}
                    onClick={() => pokemon && handlePokemonSelect(pokemon)}
                  >
                    {/* Holographic border */}
                    <div className={`absolute -inset-1 rounded-xl ${
                      pokemon
                        ? 'bg-gradient-to-r from-lab-primary to-lab-secondary opacity-50 group-hover:opacity-100'
                        : 'bg-gray-700 opacity-20'
                    } blur transition-all`}></div>
                    
                    <div className={`relative h-full rounded-xl border-2 ${
                      pokemon
                        ? 'border-lab-primary bg-gradient-to-br from-gray-800 to-gray-900'
                        : 'border-gray-700 border-dashed bg-gray-800/30'
                    } flex flex-col items-center justify-center p-3 transition-all ${
                      pokemon ? 'hover:scale-105' : ''
                    }`}>
                      
                      {pokemon ? (
                        <>
                          {/* Slot number badge */}
                          <div className="absolute top-2 left-2 w-6 h-6 bg-lab-primary rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                            {index + 1}
                          </div>
                          
                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePokemonSelect(pokemon)
                            }}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs hover:scale-110 transition-transform"
                          >
                            ×
                          </button>
                          
                          {/* Pokemon sprite */}
                          <div className="relative mb-2">
                            <div className="absolute inset-0 bg-lab-primary/20 rounded-full blur-lg animate-pulse"></div>
                            <Image
                              src={pokemon.sprites?.icon || `/sprites/${pokemon.id}_icon.png`}
                              alt={pokemon.name}
                              width={64}
                              height={64}
                              className="relative pixelated"
                              unoptimized
                              onError={(e) => {
                                // @ts-ignore
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                              }}
                            />
                          </div>
                          
                          <span className="text-xs font-tech text-lab-primary text-center truncate w-full">
                            {formatPokemonName(pokemon.name)}
                          </span>
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="w-16 h-16 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center mb-2 animate-pulse">
                            <span className="text-3xl opacity-30">?</span>
                          </div>
                          <span className="text-xs font-tech text-gray-600">
                            SLOT {index + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Lobby Status Indicator */}
        <div className="mb-6 relative">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-tech text-sm text-gray-300">
                  TRAINERS IN LOBBY: {otherPlayers.length + 1}/{2}
                </span>
              </div>
              
              <div className="flex gap-4 flex-wrap">
                {[{ id: playerId, ready: submitting || battleStarting }, ...otherPlayers].map((player, i) => (
                  <div
                    key={player.id}
                    className={`px-4 py-2 rounded-lg border ${
                      player.ready || player.teamSubmitted
                        ? 'bg-green-500/20 border-green-500'
                        : 'bg-gray-700/30 border-gray-600'
                    } transition-all`}
                  >
                    <span className={`font-tech text-xs ${
                      player.ready || player.teamSubmitted ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {player.id === playerId ? 'YOU' : `TRAINER ${i}`}: {
                        player.ready || player.teamSubmitted ? '✓' : '⏳'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg animate-shake">
            <p className="text-red-300 text-center font-tech">{error}</p>
          </div>
        )}

        {/* Pokemon Grid */}
        <div className="relative">
          <h2 className="text-2xl font-display font-bold text-lab-tech mb-4 flex items-center gap-2">
            <span className="text-2xl">💾</span>
            POKEMON DATABASE
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-800/50 rounded-xl animate-pulse border border-gray-700"
                />
              ))}
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700">
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="font-tech text-gray-500">
                NO POKEMON FOUND FOR "{searchTerm}"
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Try searching by name or Pokedex number
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((pokemon) => {
                const isSelected = selectedPokemon.some(p => p.id === pokemon.id)
                const isDisabled = selectedPokemon.length >= 6 && !isSelected
                
                return (
                  <div
                    key={pokemon.id}
                    onClick={() => !isDisabled && handlePokemonSelect(pokemon)}
                    className={`group relative aspect-square cursor-pointer transition-all ${
                      isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                  >
                    {/* Holographic effect */}
                    <div className={`absolute -inset-1 rounded-xl blur transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-lab-primary to-lab-secondary opacity-75 group-hover:opacity-100'
                        : isDisabled
                        ? 'bg-gray-700 opacity-20'
                        : 'bg-lab-tech opacity-0 group-hover:opacity-50'
                    }`}></div>
                    
                    <div className={`relative h-full rounded-xl border-2 ${
                      isSelected
                        ? 'border-lab-primary bg-gradient-to-br from-gray-800 to-teal-900'
                        : isDisabled
                        ? 'border-gray-700 bg-gray-800/50'
                        : 'border-gray-700 bg-gray-800 group-hover:border-lab-tech'
                    } p-3 flex flex-col items-center justify-between transition-all`}>
                      
                      {/* Pokedex number */}
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-mono ${
                        isSelected
                          ? 'bg-lab-primary text-gray-900'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        #{String(pokemon.id).padStart(3, '0')}
                      </div>
                      
                      {/* Selected badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-lab-primary rounded-full flex items-center justify-center animate-bounce">
                          <span className="text-gray-900 font-bold">✓</span>
                        </div>
                      )}
                      
                      {/* Pokemon sprite */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className="relative">
                          {isSelected && (
                            <div className="absolute inset-0 bg-lab-primary/30 rounded-full blur-lg animate-pulse"></div>
                          )}
                          <Image
                            src={pokemon.sprites?.front || `/sprites/${pokemon.id}.png`}
                            alt={pokemon.name}
                            width={96}
                            height={96}
                            className="relative pixelated"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Pokemon info */}
                      <div className="w-full text-center">
                        <p className={`font-tech text-sm mb-1 truncate ${
                          isSelected ? 'text-lab-primary' : 'text-white'
                        }`}>
                          {formatPokemonName(pokemon.name)}
                        </p>
                        
                        {/* Type badges */}
                        <div className="flex justify-center gap-1">
                          {pokemon.types.map((type, i) => (
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
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Battle Starting Overlay */}
      {battleStarting && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Multiple rotating rings */}
              <div className="absolute inset-0 border-4 border-lab-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-lab-secondary border-b-transparent rounded-full animate-spin-reverse"></div>
              <div className="absolute inset-8 border-4 border-lab-tech border-r-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl animate-pulse">⚔️</span>
              </div>
            </div>
            
            <h2 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-lab mb-4 animate-pulse">
              BATTLE STARTING
            </h2>
            <p className="text-lab-primary font-tech text-lg">
              Initializing battle arena...
            </p>
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-lab-primary rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 mt-8 text-center text-xs text-gray-600 font-tech pb-4">
        Fan-made project, not affiliated with Pokémon.
      </footer>
      
      {/* Sound Toggle */}
      <SoundToggle />
    </main>
  )
}
