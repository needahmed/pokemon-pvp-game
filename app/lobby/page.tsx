"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import io, { Socket } from "socket.io-client"
import Image from "next/image"

// Global socket connection
let socket: Socket | null = null;

// New component to contain the lobby logic
function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const playerId = searchParams.get("playerId");

  const [players, setPlayers] = useState<{id: string, ready: boolean}[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Connect to socket server and set up event listeners
  useEffect(() => {
    if (!roomId || !playerId) {
      console.log("Missing roomId or playerId, redirecting...");
      router.push("/");
      return;
    }

    if (!socket) {
      console.log("Initializing socket connection...");
      const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
      console.log(`Lobby Socket URL: ${socketURL}`);
      socket = io(socketURL, {
        reconnectionAttempts: 5,
        timeout: 10000,
      });
    } else if (!socket.connected) {
       console.log("Socket exists but not connected, attempting to connect...");
       socket.connect();
    } else {
       console.log("Socket already connected:", socket.id);
       setConnecting(false);
       socket?.emit("joinRoom", { roomId, playerId });
    }

    const onConnect = () => {
      console.log("Connected to socket server:", socket?.id);
      setConnecting(false);
      socket?.emit("joinRoom", { roomId, playerId });
    };
    
    const onConnectError = (err: Error) => {
      console.error("Socket connection error:", err);
      setError("Failed to connect to game server. Please try again.");
      setConnecting(false);
    };
    
    const onPlayerJoined = ({ playerId: joinedPlayerId, roomId: joinedRoomId, players: roomPlayers }: {playerId: string, roomId: string, players: {id: string, ready: boolean}[]}) => {
      console.log(`Player ${joinedPlayerId} joined room ${joinedRoomId}`);
      if (roomPlayers) {
        setPlayers(roomPlayers);
        if (roomPlayers.length > 0 && roomPlayers[0].id === playerId) {
          setIsHost(true);
        } else {
          setIsHost(false);
        }
      }
    };
    
    const onPlayerLeft = ({ playerId: leftPlayerId, players: remainingPlayers }: {playerId: string, players: {id: string, ready: boolean}[]}) => {
      console.log(`Player ${leftPlayerId} left`);
      if (remainingPlayers) {
        setPlayers(remainingPlayers);
        if (remainingPlayers.length > 0 && remainingPlayers[0].id === playerId) {
          setIsHost(true);
        } else {
           setIsHost(false);
        }
      }
    };
    
    const onPlayerReady = ({ playerId: readyPlayerId }: {playerId: string}) => {
      setPlayers(prev =>
        prev.map(p => p.id === readyPlayerId ? { ...p, ready: true } : p)
      );
    };
    
    const onStartTeamSelection = () => {
      console.log("Starting team selection");
      router.push(`/team-selection?roomId=${roomId}&playerId=${playerId}`);
    };
    
    socket?.on("connect", onConnect);
    socket?.on("connect_error", onConnectError);
    socket?.on("playerJoined", onPlayerJoined);
    socket?.on("playerLeft", onPlayerLeft);
    socket?.on("playerReady", onPlayerReady);
    socket?.on("startTeamSelection", onStartTeamSelection);
    
    return () => {
      console.log("Cleaning up lobby listeners for:", socket?.id);
      socket?.off("connect", onConnect);
      socket?.off("connect_error", onConnectError);
      socket?.off("playerJoined", onPlayerJoined);
      socket?.off("playerLeft", onPlayerLeft);
      socket?.off("playerReady", onPlayerReady);
      socket?.off("startTeamSelection", onStartTeamSelection);
    };
  }, [roomId, playerId, router]);

  // Start the game (begin team selection)
  const handleStartGame = () => {
    if (!socket || !roomId) return;
    const readyPlayers = players.filter(p => p.ready).length;
    if (players.length >= 2 && readyPlayers === players.length) {
      socket.emit("startTeamSelection", { roomId });
    } else {
       setError("All players must be ready to start.");
       setTimeout(() => setError(""), 3000);
    }
  };

  // Set player as ready
  const handleReadyUp = () => {
    if (!socket || !roomId || !playerId) return;
    
    const currentPlayer = players.find(p => p.id === playerId);
    if (currentPlayer?.ready) return;

    socket.emit("playerReady", { roomId, playerId });
  };

  // Copy room ID to clipboard
  const copyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomId || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-500">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-pokemon mb-4">Error</h1>
          <p className="mb-4">Missing room ID or player ID.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-pokemon py-2 px-4 rounded"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  const currentPlayerReady = players.find(p => p.id === playerId)?.ready ?? false;
  const allPlayersReady = players.length > 0 && players.every(p => p.ready);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-4 text-white">
          <h1 className="text-2xl font-pokemon text-center">Pokémon Battle Lobby</h1>
        </div>
        
        {connecting ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-bounce mb-4">
              <Image 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                alt="Loading" 
                width={64} 
                height={64}
                unoptimized
              />
            </div>
            <p className="font-pokemon">Connecting to server...</p>
          </div>
        ) : error && !connecting ? (
          <div className="p-8 text-center">
            <p className="text-red-500 font-pokemon mb-4">{error}</p>
            <button 
              onClick={() => router.push("/")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-pokemon py-2 px-4 rounded"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <>
            {/* Room info */}
            <div className="p-4 bg-gray-100 flex justify-between items-center">
              <div>
                <span className="text-gray-600 font-semibold">Room ID:</span>
                <span className="ml-2 font-mono bg-gray-200 px-2 py-1 rounded">{roomId}</span>
              </div>
              <button 
                onClick={copyRoomId}
                className="text-blue-500 hover:text-blue-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            
            {/* Players */}
            <div className="p-6">
              <h2 className="font-pokemon text-lg mb-4">Players in Room ({players.length}/2)</h2>
              
              {players.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Waiting for players to join...
                </div>
              ) : (
                <div className="space-y-4">
                  {players.map((player) => (
                    <div 
                      key={player.id} 
                      className="flex items-center justify-between border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <Image
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${(player.id.charCodeAt(0) % 151) + 1}.png`}
                            alt="Trainer"
                            width={32}
                            height={32}
                            unoptimized
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-semibold">{player.id}</div>
                          <div className="text-sm text-gray-500">
                            {player.id === playerId ? "You" : "Trainer"}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        player.ready ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {player.ready ? "Ready" : "Not Ready"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="p-6 border-t flex justify-center">
              {players.length < 2 ? (
                <div className="text-center">
                  <p className="font-pokemon text-gray-600 mb-2">Waiting for another player to join...</p>
                  <p className="text-sm text-gray-500">Share the Room ID with a friend!</p>
                </div>
              ) : isHost ? (
                <button
                  onClick={handleStartGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-pokemon py-3 px-6 rounded-lg shadow-md transition-colors duration-200"
                  disabled={!allPlayersReady || players.length < 2}
                >
                  {allPlayersReady ? 'Start Game' : 'Waiting for opponent...'}
                </button>
              ) : (
                <button
                  onClick={handleReadyUp}
                  className={`${
                    currentPlayerReady ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                  } text-white font-pokemon py-3 px-6 rounded-lg shadow-md transition-colors duration-200`}
                  disabled={currentPlayerReady}
                >
                  {currentPlayerReady ? 'Ready!' : 'Ready Up'}
                </button>
              )}
            </div>
          </>
        )}
        
        <div className="bg-gray-100 p-3 text-center text-xs text-gray-600">
          <p>Fan-made project, not affiliated with Pokémon.</p>
        </div>
      </div>
    </div>
  );
}

// Export the main page component that includes Suspense
export default function LobbyPage() {
  return (
    <Suspense fallback={<LobbyLoading />}>
      <LobbyContent />
    </Suspense>
  );
}

// Simple loading component for Suspense fallback
function LobbyLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden">
         <div className="bg-red-600 p-4 text-white">
          <h1 className="text-2xl font-pokemon text-center">Pokémon Battle Lobby</h1>
        </div>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin mb-4">
             <Image 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                alt="Loading" 
                width={64} 
                height={64}
                unoptimized
              />
          </div>
          <p className="font-pokemon">Loading Lobby...</p>
        </div>
      </div>
    </div>
  );
} 