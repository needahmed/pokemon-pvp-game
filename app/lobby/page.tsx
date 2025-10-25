"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import io, { Socket } from "socket.io-client"
import Image from "next/image"
import Link from "next/link"
import { Trophy, HelpCircle, Crown, Swords, AlertTriangle, Copy, Check, Clock } from "lucide-react"
import SoundToggle from "@/components/SoundToggle"
import { SpotlightBeams } from "@/components/animations/SpotlightBeams"
import { ChampionSparks } from "@/components/animations/ChampionSparks"

// Component to contain the lobby logic
function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId")?.toUpperCase();
  const playerId = searchParams.get("playerId");

  const socketRef = useRef<Socket | null>(null);

  const [players, setPlayers] = useState<{id: string, ready: boolean, isHost?: boolean}[]>([]);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const MAX_PLAYERS = 2;

  useEffect(() => {
    console.log("[Lobby] useEffect triggered. RoomID:", roomId, "PlayerID:", playerId);

    if (!roomId || !playerId) {
      console.log("[Lobby] Missing roomId or playerId, redirecting to home.");
      router.push("/");
      return;
    }

    if (!socketRef.current) {
        console.log("[Lobby] Initializing new socket connection via socketRef.");
        const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:4000";
        console.log(`Lobby Socket URL: ${socketURL}`);
        socketRef.current = io(socketURL, { 
            reconnectionAttempts: 5, 
            timeout: 10000, 
            transports: ['websocket', 'polling']
        });
        setConnecting(true);
    } else if (!socketRef.current.connected) {
       console.log("SocketRef exists but not connected, attempting to connect...");
       socketRef.current.connect();
    } else {
       console.log("SocketRef already connected:", socketRef.current.id);
       setConnecting(false);
       socketRef.current?.emit("joinRoom", { roomId, playerId });
    }
    
    const currentSocket = socketRef.current; 

    // Define event handlers
    const onConnect = () => {
        console.log("Connected to socket server:", currentSocket?.id);
        setConnecting(false);
        currentSocket?.emit("joinRoom", { roomId, playerId });
    };

    const onDisconnect = (reason: Socket.DisconnectReason) => {
        console.log("[Lobby] Socket disconnected. Reason:", reason, "Socket ID:", currentSocket.id);
        setConnecting(false);
        if (reason === "io server disconnect") {
            setError("Disconnected by server.");
        } else if (reason === "io client disconnect") {
            setError("You disconnected.");
        } else {
            setError("Connection lost. Please check internet.");
        }
    };

    const onConnectError = (err: Error) => {
        console.error("Socket connection error:", err);
        setError("Failed to connect to game server. Please try again.");
        setConnecting(false);
    };

    const onRoomUpdate = (roomPlayers: {id: string, ready: boolean}[]) => {
        console.log("[Lobby] Received roomUpdate:", roomPlayers, "Socket ID:", currentSocket.id);
        setPlayers(roomPlayers.map((p, index) => ({ ...p, isHost: index === 0 }) ));
    };

    const onStartTeamSelection = () => {
        console.log("[Lobby] Received startTeamSelection, navigating. Socket ID:", currentSocket.id);
        router.push(`/team-selection?roomId=${roomId}&playerId=${playerId}`);
    };

    const onPlayerKicked = ({ kickedPlayerId }: { kickedPlayerId: string }) => {
        console.log("[Lobby] Received playerKicked:", kickedPlayerId, "Socket ID:", currentSocket.id);
        if (kickedPlayerId === playerId) {
            alert("You have been kicked from the lobby.");
            currentSocket.disconnect();
            socketRef.current = null;
            router.push("/");
        }
    };

    const onPlayerJoined = ({ playerId: joinedPlayerId, roomId: joinedRoomId, players: roomPlayers }: {playerId: string, roomId: string, players: {id: string, ready: boolean}[]}) => {
      console.log(`[Lobby] Event: playerJoined. Details: room=${joinedRoomId}, newPlayer=${joinedPlayerId}. All players:`, roomPlayers);
      if (roomPlayers) {
        setPlayers(roomPlayers.map((p, index) => ({ ...p, isHost: index === 0 }) ));
      }
    };

    const onPlayerLeft = ({ playerId: leftPlayerId, players: remainingPlayers }: {playerId: string, players: {id: string, ready: boolean}[]}) => {
      console.log(`Player ${leftPlayerId} left`);
      if (remainingPlayers) {
        setPlayers(remainingPlayers.map((p, index) => ({ ...p, isHost: index === 0 }) ));
      }
    };

    const onPlayerReady = ({ playerId: readyPlayerId }: {playerId: string}) => {
      console.log(`[Lobby] Event: playerReady. Player ${readyPlayerId} is now ready.`);
      setPlayers(prev =>
        prev.map(p => p.id === readyPlayerId ? { ...p, ready: true } : p)
      );
    };

    // Add listeners
    console.log("[Lobby] Adding socket event listeners. Current socket state:", currentSocket.connected, "ID (if any):", currentSocket.id);
    currentSocket.on("connect", onConnect);
    currentSocket.on("disconnect", onDisconnect);
    currentSocket.on("connect_error", onConnectError);
    currentSocket.on("roomUpdate", onRoomUpdate);
    currentSocket.on("startTeamSelection", onStartTeamSelection);
    currentSocket.on("playerKicked", onPlayerKicked);
    currentSocket.on("playerJoined", onPlayerJoined);
    currentSocket.on("playerLeft", onPlayerLeft);
    currentSocket.on("playerReady", onPlayerReady);

    // Handle case where socket might already be connected
    if (currentSocket.connected) {
        console.log("[Lobby] useEffect: Socket was already connected (ID:", currentSocket.id, "). Re-emitting joinRoom.");
        setConnecting(false);
        currentSocket.emit("joinRoom", { roomId, playerId });
    } else {
        if (!currentSocket.connected) {
            console.log("[Lobby] useEffect: Socket not connected. 'connect' event will handle joinRoom. Current ID (if any):", currentSocket.id);
            setConnecting(true);
        }
    }

    return () => {
        console.log("[Lobby] useEffect cleanup. Removing listeners for socket ID (if connected):", currentSocket.id);
        currentSocket.off("connect", onConnect);
        currentSocket.off("disconnect", onDisconnect);
        currentSocket.off("connect_error", onConnectError);
        currentSocket.off("roomUpdate", onRoomUpdate);
        currentSocket.off("startTeamSelection", onStartTeamSelection);
        currentSocket.off("playerKicked", onPlayerKicked);
        currentSocket.off("playerJoined", onPlayerJoined);
        currentSocket.off("playerLeft", onPlayerLeft);
        currentSocket.off("playerReady", onPlayerReady);
        console.log("[Lobby] Listeners removed for socket ID:", currentSocket.id);
        if (currentSocket?.connected) {
          console.log("Disconnecting socket on cleanup:", currentSocket.id);
          currentSocket.disconnect();
        }
    };
}, [roomId, playerId, router]);

  // Actions
  const handleStartGame = () => {
    if (!socketRef.current || !roomId) return;
    const readyPlayersCount = players.filter(p => p.ready).length;
    if (players.length === MAX_PLAYERS && readyPlayersCount === MAX_PLAYERS) { 
      console.log("[Lobby] Emitting startTeamSelection via socketRef.current");
      socketRef.current.emit("startTeamSelection", { roomId });
    } else {
      setError(`All ${MAX_PLAYERS} players must be present and ready to start.`);
      setTimeout(() => setError(""), 3000);
    }
  };
  const handleReadyUp = () => {
    console.log("[Lobby] handleReadyUp called.");
    if (!socketRef.current || !roomId || !playerId || players.find(p=>p.id === playerId)?.ready) {
      console.log("[Lobby] handleReadyUp: Conditions not met or already ready. Socket connected:", socketRef.current?.connected);
      return;
    }
    console.log("[Lobby] Emitting playerReady via socketRef.current:", { roomId, playerId });
    socketRef.current.emit("playerReady", { roomId, playerId });
  };
  const copyRoomIdToClipboard = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => console.error('Failed to copy Room ID:', err));
  };
  const handleKickPlayer = (kickPlayerId: string) => {
    if (isCurrentUserHost && kickPlayerId !== playerId && socketRef.current) {
      console.log("[Lobby] Emitting kickPlayer via socketRef.current");
      socketRef.current.emit("kickPlayer", { roomId, playerIdToKick: kickPlayerId });
    }
  };

  // Derived states
  const isCurrentUserHost = players.find(p => p.id === playerId)?.isHost || false;
  const currentPlayer = players.find(p => p.id === playerId);
  const allPlayersPresentAndReady = players.length === MAX_PLAYERS && players.every(p => p.ready);

  // Initial loading/error before useEffect if params missing
  if (!roomId || !playerId && !connecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-950 via-indigo-950 to-black p-4 text-white">
        <Image src="/logo.png" alt="Logo" width={200} height={100} className="mb-6 drop-shadow-lg" />
        <h1 className="text-3xl font-pokemon mb-3">Oops!</h1>
        <p className="mb-6 font-semibold text-lg">Room ID or Player ID is missing.</p>
        <Link href="/play" legacyBehavior>
          <a className="bg-yellow-400 hover:bg-yellow-500 text-red-700 font-pokemon py-3 px-8 rounded-lg shadow-xl transition-colors text-xl border-2 border-yellow-600">
            Back to Lobby Setup
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-black relative overflow-hidden font-sans">
      {/* Dramatic spotlight beams */}
      <SpotlightBeams count={4} />
      
      {/* Particle sparks */}
      <ChampionSparks count={50} />
      
      {/* Header */}
      <header className="relative z-50 bg-black/30 backdrop-blur-md shadow-md sticky top-0 border-b border-arena-primary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a className="flex items-center">
              <Image src="/logo.png" alt="Site Logo" width={100} height={35} />
              <span className="ml-2 text-xl font-pokemon text-arena-accent hover:text-arena-primary transition-colors">Home</span>
            </a>
          </Link>
          <h1 className="text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-arena-primary via-white to-arena-primary">
            CHAMPION'S LOBBY
          </h1>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 text-white">
        {connecting ? (
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-arena-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-arena-accent border-b-transparent rounded-full animate-spin-reverse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="w-12 h-12 text-arena-primary" />
              </div>
            </div>
            <p className="font-display text-2xl text-arena-primary animate-pulse">Connecting to Arena...</p>
          </div>
        ) : error && !connecting && !players.length ? (
          <div className="w-full max-w-md bg-red-700/80 rounded-xl shadow-2xl p-8 text-center border-2 border-red-900 backdrop-blur-sm">
            <h2 className="text-3xl font-display text-yellow-300 mb-4">Connection Error</h2>
            <p className="text-white mb-6 text-lg">{error}</p>
            <Link href="/play" legacyBehavior>
              <a className="bg-yellow-400 hover:bg-yellow-500 text-red-700 font-pokemon py-3 px-8 rounded-lg shadow-lg transition-colors text-xl border-2 border-yellow-600">
                Try Again
              </a>
            </Link>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-6xl relative">
              
              {/* Championship Title Banner */}
              <div className="relative mb-8 text-center">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-full max-w-2xl h-1 bg-gradient-to-r from-transparent via-arena-primary to-transparent"></div>
                
                <div className="inline-block relative">
                  <div className="absolute -inset-8 bg-arena-primary/30 blur-3xl animate-pulse-champion"></div>
                  
                  <h1 className="relative text-5xl md:text-7xl font-display font-black mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-primary via-white to-arena-primary animate-shine bg-[length:200%_auto]">
                      CHAMPION'S LOBBY
                    </span>
                  </h1>
                  
                  {/* Room code */}
                  <div className="relative mt-4 inline-flex items-center gap-4">
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-arena-primary"></div>
                    <div className="px-8 py-3 bg-black/50 border-2 border-arena-primary rounded-lg backdrop-blur-sm">
                      <span className="font-tech text-2xl text-arena-primary tracking-widest">
                        {roomId}
                      </span>
                    </div>
                    <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-arena-primary"></div>
                  </div>
                  
                  {/* Copy button */}
                  <button
                    onClick={copyRoomIdToClipboard}
                    className="mt-4 px-6 py-2 bg-arena-primary/20 border border-arena-primary rounded-lg hover:bg-arena-primary/30 transition-all font-tech text-sm text-arena-primary hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        COPIED!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        COPY CODE
                      </>
                    )}
                  </button>
                </div>
                
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl h-1 bg-gradient-to-r from-transparent via-arena-primary to-transparent"></div>
              </div>

              {/* Main Arena Card */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-arena-primary via-arena-secondary to-arena-dragon opacity-20 blur-2xl animate-pulse-slow"></div>
                
                <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-4 border-arena-primary shadow-2xl overflow-hidden">
                  
                  <div className="h-3 bg-gradient-to-r from-arena-primary via-arena-secondary to-arena-dragon"></div>
                  
                  <div className="p-8">
                    {/* Battle Status Banner */}
                    <div className="mb-8 text-center">
                      <div className="inline-flex items-center gap-3 px-8 py-3 bg-black/50 rounded-full border-2 border-arena-accent">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="font-tech text-arena-accent text-sm tracking-wider">
                          ARENA STATUS: PREPARING
                        </span>
                      </div>
                    </div>

                    {/* Trainers Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      {players.map((player, index) => (
                        <div
                          key={player.id}
                          className={`relative group ${
                            player.id === playerId
                              ? 'ring-4 ring-arena-primary'
                              : 'ring-2 ring-arena-accent/30'
                          } rounded-2xl`}
                        >
                          <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-600 hover:border-arena-primary transition-all">
                            
                            {/* Trainer Header */}
                            <div className="flex items-center gap-4 mb-4">
                              {/* Avatar */}
                              <div className="relative">
                                <div className={`absolute -inset-2 ${
                                  player.id === playerId 
                                    ? 'bg-arena-primary' 
                                    : 'bg-arena-accent'
                                  } rounded-full opacity-30 blur animate-pulse`}></div>
                                
                                <div className={`relative w-20 h-20 rounded-full border-4 ${
                                  player.id === playerId
                                    ? 'border-arena-primary'
                                    : 'border-arena-accent'
                                } overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center`}>
                                  <Image
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${(index * 37 + 25) % 386 + 1}.png`}
                                    alt="Trainer"
                                    width={64}
                                    height={64}
                                    unoptimized
                                  />
                                </div>
                                
                                {player.isHost && (
                                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-arena-primary rounded-full flex items-center justify-center border-2 border-gray-900 text-sm">
                                    <Crown className="w-5 h-5 text-white" />
                                  </div>
                                )}
                              </div>

                              {/* Trainer Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-display font-bold text-xl ${
                                    player.id === playerId
                                      ? 'text-arena-primary'
                                      : 'text-white'
                                  }`}>
                                    {player.id}
                                  </h3>
                                  {player.id === playerId && (
                                    <span className="px-2 py-0.5 bg-arena-primary/20 text-arena-primary text-xs font-tech rounded">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                
                                {player.isHost && (
                                  <span className="text-xs text-arena-primary font-tech">
                                    CHAMPION SEAT
                                  </span>
                                )}
                              </div>

                              {/* Kick button */}
                              {isCurrentUserHost && player.id !== playerId && (
                                <button
                                  onClick={() => handleKickPlayer(player.id)}
                                  className="px-3 py-1 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm hover:bg-red-500/30 transition-all font-tech"
                                >
                                  REMOVE
                                </button>
                              )}
                            </div>

                            {/* Ready Status */}
                            <div className={`p-4 rounded-lg border-2 ${
                              player.ready
                                ? 'bg-green-500/10 border-green-500'
                                : 'bg-gray-700/30 border-gray-600'
                            } transition-all`}>
                              <div className="flex items-center justify-between">
                                <span className={`font-tech text-sm flex items-center gap-2 ${
                                  player.ready ? 'text-green-400' : 'text-gray-400'
                                }`}>
                                  {player.ready ? (
                                    <>
                                      <Check className="w-4 h-4" />
                                      READY TO BATTLE
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-4 h-4" />
                                      PREPARING...
                                    </>
                                  )}
                                </span>
                                
                                {player.ready && (
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Empty slots */}
                      {Array.from({ length: MAX_PLAYERS - players.length }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border-2 border-dashed border-gray-700"
                        >
                          <div className="h-full flex flex-col items-center justify-center text-center py-8">
                            <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-700 flex items-center justify-center mb-4 animate-pulse">
                              <HelpCircle className="w-10 h-10 text-gray-700" />
                            </div>
                            <p className="text-gray-500 font-tech text-sm">
                              WAITING FOR TRAINER...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Area */}
                    <div className="relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-arena-primary to-transparent"></div>
                      
                      <div className="pt-8 flex flex-col items-center gap-4">
                        
                        {/* Error message */}
                        {error && !connecting && (
                          <div className="w-full max-w-md p-4 bg-red-500/20 border-2 border-red-500 rounded-lg animate-shake">
                            <p className="text-red-300 text-center font-tech text-sm flex items-center justify-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              {error}
                            </p>
                          </div>
                        )}

                        {/* Ready Up Button */}
                        {!currentPlayer?.ready && (
                          <button
                            onClick={handleReadyUp}
                            className="group relative w-full max-w-md overflow-hidden rounded-xl transition-all duration-300 hover:scale-105"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            
                            <div className="relative px-8 py-6 flex items-center justify-center gap-3">
                              <Swords className="w-8 h-8 animate-bounce" />
                              <span className="font-display font-bold text-2xl text-white tracking-wide">
                                I'M READY!
                              </span>
                              <Swords className="w-8 h-8 animate-bounce" style={{animationDelay: '0.2s'}} />
                            </div>
                          </button>
                        )}

                        {/* Start Game Button (Host Only) */}
                        {isCurrentUserHost && (
                          <button
                            onClick={handleStartGame}
                            disabled={!allPlayersPresentAndReady}
                            className="group relative w-full max-w-md overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                          >
                            <div className="absolute inset-0 bg-gradient-arena"></div>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            
                            <div className="relative px-8 py-6 flex items-center justify-center gap-3">
                              <Trophy className="w-8 h-8" />
                              <span className="font-display font-bold text-2xl text-white tracking-wide">
                                BEGIN BATTLE
                              </span>
                              <Trophy className="w-8 h-8" />
                            </div>
                          </button>
                        )}

                        {/* Status Text */}
                        <p className="text-center text-gray-400 font-tech text-sm max-w-md">
                          {isCurrentUserHost ? (
                            allPlayersPresentAndReady ? (
                              <span className="text-green-400 animate-pulse">
                                ✓ ALL TRAINERS READY - START WHEN PREPARED
                              </span>
                            ) : (
                              `Waiting for ${MAX_PLAYERS - players.length} more trainer(s)...`
                            )
                          ) : (
                            currentPlayer?.ready ? (
                              <span className="text-green-400">
                                ✓ Waiting for champion to start battle...
                              </span>
                            ) : (
                              'Click ready when you are prepared for battle'
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-3 bg-gradient-to-r from-arena-dragon via-arena-secondary to-arena-primary"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <footer className="relative z-10 w-full py-8 text-center text-white/80 text-sm">
          <p>Pokémon © Nintendo, Creatures Inc., GAME FREAK inc. This is a fan-created project.</p>
        </footer>
        
        {/* Sound Toggle */}
        <SoundToggle />
      </main>
    </div>
  );
}

// Suspense fallback loading component
function LobbyLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-indigo-950 to-black p-4 text-white">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-4 border-4 border-blue-400 border-b-transparent rounded-full animate-spin-reverse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🏟️</span>
          </div>
        </div>
        <p className="font-display text-2xl text-yellow-400 animate-pulse">Loading Arena...</p>
        <p className="text-sm text-yellow-200 mt-2">Please wait while we connect you.</p>
      </div>
    </div>
  );
}

// Main page component that uses Suspense
export default function LobbyPage() {
  return (
    <Suspense fallback={<LobbyLoading />}>
      <LobbyContent />
    </Suspense>
  );
}
