"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import PokemonCard from "@/components/PokemonCard"
import { PokemonCardSkeletonGrid } from "@/components/PokemonCardSkeleton"
import LoadingSpinner from "@/components/LoadingSpinner"
import SoundToggle from "@/components/SoundToggle"
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
      setSubmitting(false); // Stop submitting state if we can't connect
    };
    
    // Handle start battle event
    const handleStartBattle = (data: any) => {
      console.log(`%c BATTLE STARTING EVENT RECEIVED`, 'background: #ff0000; color: white; font-size: 20px');
      console.log(`DATA:`, data);
      console.log(`Redirecting to: /battle?roomId=${roomId}&playerId=${playerId}`);
      setBattleStarting(true);
      
      // Force navigation to battle page - more reliable than router.push
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
        // Update other players' status
        const others = Object.keys(data.players)
          .filter(id => id !== playerId)
          .map(id => ({
            id,
            ready: data.players[id].ready,
            teamSubmitted: data.players[id].teamSubmitted
          }));
        setOtherPlayers(others);
        
        // Check if all players have submitted teams - if so, show a message that battle is about to start
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

  // No need to load Pokemon in batches, instead we'll search for specific Pokemon
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    
    // Start loading when user types something
    setIsLoading(true);
    
    const searchPokemon = async () => {
      try {
        // Try to fetch by exact ID if the search term is a number
        if (!isNaN(Number(searchTerm))) {
          const pokemon = await fetchPokemonByNameOrId(searchTerm);
          if (pokemon) {
            setSearchResults(pokemon ? [pokemon as Pokemon] : []);
          } else {
            setSearchResults([]);
          }
        } else {
          // Search by name - fetch the first 10 matching Pokemon
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
    
    // Debounce the search to prevent too many API calls
    const timer = setTimeout(() => {
      searchPokemon();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePokemonSelect = (pokemon: Pokemon) => {
    setSelectedPokemon((prev) => {
      // If already selected, remove it
      const existingIndex = prev.findIndex(p => p.id === pokemon.id);
      if (existingIndex !== -1) {
        return prev.filter((_, index) => index !== existingIndex);
      }

      // If already have 6 Pokémon and trying to add more, don't allow
      if (prev.length >= 6) {
        return prev;
      }

      // Add the new Pokémon
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
    
    // Send team to the server
    socket.emit("submitTeam", { 
      roomId, 
      playerId, 
      team: selectedPokemon
    });
  }

  return (
    <main className="min-h-screen p-4 bg-gray-100 page-transition">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-600 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl text-white font-pokemon mb-4 md:mb-0">Select Your Team</h1>

          <div className="flex items-center space-x-4">
            <Link href="/" passHref>
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white font-pokemon py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Back to Menu
              </button>
            </Link>
            
            <div className="bg-white px-4 py-2 rounded-lg font-pokemon text-sm">
              {selectedPokemon.length}/6 Pokémon selected
            </div>

            <button
              onClick={handleSubmitTeam}
              disabled={selectedPokemon.length !== 6 || submitting || battleStarting}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-pokemon py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {submitting ? "Submitting..." : battleStarting ? "Starting..." : "Submit Team"}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Pokémon by name or ID..."
            className="w-full p-3 rounded-lg border-2 border-gray-300 font-pokemon"
          />
        </div>

        {error && <p className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">{error}</p>}

        {/* Lobby status */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg shadow-md">
          <h2 className="font-pokemon text-lg mb-2">Lobby Status</h2>
          <p className="text-sm mb-2">
            Room ID: <span className="font-mono bg-blue-100 px-1 py-0.5 rounded">{roomId}</span>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {/* You */}
            <div className="flex items-center justify-between bg-white p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-500">{playerId?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium">{playerId} (You)</p>
                  <p className="text-xs text-gray-500">
                    {battleStarting ? "Battle starting soon!" : 
                     submitting ? "Submitting team..." : 
                     selectedPokemon.length === 6 ? "Team ready to submit" : 
                     `${selectedPokemon.length}/6 Pokémon selected`}
                  </p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                battleStarting ? "bg-green-500 text-white" :
                submitting ? "bg-green-100 text-green-800" : 
                selectedPokemon.length === 6 ? "bg-yellow-100 text-yellow-800" : 
                "bg-gray-100 text-gray-800"
              }`}>
                {battleStarting ? "Ready!" :
                 submitting ? "Ready" : 
                 selectedPokemon.length === 6 ? "Ready to submit" : 
                 "Selecting"}
              </div>
            </div>
            
            {/* Other players */}
            {otherPlayers.map(player => (
              <div key={player.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-red-500">{player.id.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{player.id}</p>
                    <p className="text-xs text-gray-500">
                      {battleStarting ? "Battle starting soon!" :
                       player.teamSubmitted ? "Team submitted" : "Selecting team..."}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  battleStarting ? "bg-green-500 text-white" :
                  player.teamSubmitted ? "bg-green-100 text-green-800" : 
                  "bg-gray-100 text-gray-800"
                }`}>
                  {battleStarting ? "Ready!" :
                   player.teamSubmitted ? "Ready" : "Selecting"}
                </div>
              </div>
            ))}
            
            {otherPlayers.length === 0 && (
              <div className="flex items-center justify-center bg-gray-50 p-3 rounded-lg col-span-1 md:col-span-2">
                <p className="text-gray-500 text-sm">Waiting for other players to join...</p>
              </div>
            )}
            
            {battleStarting && (
              <div className="col-span-1 md:col-span-2 bg-green-100 p-4 rounded-lg text-center">
                <p className="text-green-700 font-pokemon animate-pulse text-lg">Battle is starting...</p>
                <p className="text-green-600 text-sm mt-1">You will be redirected to the battle page automatically.</p>
                <p className="text-green-600 text-sm mt-1">If not redirected after a few seconds, please click the button below:</p>
                
                <button
                  onClick={() => window.location.href = `/battle?roomId=${roomId}&playerId=${playerId}`}
                  className="mt-3 bg-green-500 hover:bg-green-600 text-white font-pokemon py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Go to Battle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected team preview */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <h2 className="font-pokemon text-lg mb-2">Your Team</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {Array(6).fill(null).map((_, index) => {
              const pokemon = selectedPokemon[index]
              return (
                <div key={index} className="bg-gray-100 p-2 rounded-lg aspect-square flex items-center justify-center">
                  {pokemon ? (
                    <div className="text-center cursor-pointer" onClick={() => handlePokemonSelect(pokemon)}>
                      <Image 
                        src={pokemon.sprites?.icon || `/icons/${pokemon.id}_icon.png`}
                        alt={pokemon.name}
                        width={64}
                        height={64}
                        className="mx-auto"
                        unoptimized
                        onError={(e) => {
                          // Fallback to a direct PokeAPI sprite
                          // @ts-ignore - TypeScript doesn't know about currentTarget.onerror
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                        }}
                      />
                      <span className="text-xs font-pokemon block truncate">
                        {formatPokemonName(pokemon.name)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center">
                      <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto">
                        ?
                      </div>
                      <span className="text-xs font-pokemon">Empty</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Search results */}
        <div>
          <h2 className="font-pokemon text-lg mb-2">Search Results</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <PokemonCardSkeletonGrid count={10} />
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <p className="font-pokemon text-gray-600">No Pokémon found matching "{searchTerm}"</p>
              <p className="text-sm text-gray-500 mt-2">Try searching by name (e.g., "pikachu") or ID (e.g., "25")</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((pokemon) => (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
                  isSelected={selectedPokemon.some(p => p.id === pokemon.id)}
                  onSelect={() => handlePokemonSelect(pokemon)}
                  disabled={selectedPokemon.length >= 6 && !selectedPokemon.some(p => p.id === pokemon.id)}
            />
          ))}
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-gray-600 font-pokemon">
        Fan-made project, not affiliated with Pokémon.
      </footer>
      
      {/* Sound Toggle */}
      <SoundToggle />
    </main>
  )
}
