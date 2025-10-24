"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import io, { Socket } from "socket.io-client"
import Image from "next/image"
import Link from "next/link"
import SoundToggle from "@/components/SoundToggle"

// Global socket connection
// let socket: Socket | null = null; // Removed global socket

// Component to contain the lobby logic
function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId")?.toUpperCase(); // Ensure roomId is consistently uppercase
  const playerId = searchParams.get("playerId");

  const socketRef = useRef<Socket | null>(null);

  const [players, setPlayers] = useState<{id: string, ready: boolean, isHost?: boolean}[]>([]);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const MAX_PLAYERS = 2; // Define max players

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
            // autoConnect: true, // Default is true, io() will attempt to connect
        });
        setConnecting(true); // We are attempting to connect since socket was just created
    } else if (!socketRef.current.connected) {
       console.log("SocketRef exists but not connected, attempting to connect...");
       socketRef.current.connect(); // Use socketRef.current
    } else {
       console.log("SocketRef already connected:", socketRef.current.id); // Use socketRef.current
       setConnecting(false);
       socketRef.current?.emit("joinRoom", { roomId, playerId }); // Use socketRef.current
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
            setError("Disconnected by server."); // User might need to rejoin or refresh
        } else if (reason === "io client disconnect") {
            setError("You disconnected.");
        } else {
            setError("Connection lost. Please check internet.");
        }
        // setPlayers([]); // Consider clearing players
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
            currentSocket.disconnect(); // Disconnect the actual socket instance
            socketRef.current = null; // Nullify the ref
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

    // Handle case where socket might already be connected (e.g. due to StrictMode re-render or hot reload)
    if (currentSocket.connected) {
        console.log("[Lobby] useEffect: Socket was already connected (ID:", currentSocket.id, "). Re-emitting joinRoom.");
        setConnecting(false); // Already connected
        currentSocket.emit("joinRoom", { roomId, playerId }); // Ensure joinRoom is emitted
    } else {
        // If not connected, io() constructor should be attempting to connect. 
        // If it's not even in a 'connecting' state, try an explicit connect.
        // Note: socket.io-client v3+ `io.Socket.connecting` was removed.
        // We rely on `connected` flag and the `connect` event.
        // If it's not connected, and we didn't just create it (where `setConnecting(true)` was called),
        // it might imply an issue. However, io() should handle initial connection.
        // We can ensure `setConnecting(true)` if it's not connected.
        if (!currentSocket.connected) {
            console.log("[Lobby] useEffect: Socket not connected. 'connect' event will handle joinRoom. Current ID (if any):", currentSocket.id);
            setConnecting(true); // Explicitly set connecting if not connected.
            // currentSocket.connect(); // Avoid explicit connect if io() is already handling it, unless issues persist
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
        // Decide on disconnect strategy: if socketRef.current is not nulled (e.g. on kick), it will persist.
        // If roomId/playerId changes, a new socket will be made.
        // If component unmounts completely, socketRef.current?.disconnect() could be called here.
        // For now, this cleanup only removes listeners, allowing the socket to persist through StrictMode re-renders.
        if (currentSocket?.connected) {
          console.log("Disconnecting socket on cleanup:", currentSocket.id);
          currentSocket.disconnect(); // Added disconnect
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
  if (!roomId || !playerId && !connecting) { // Added !connecting to prevent flash if params load slow
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-700 via-red-600 to-orange-500 p-4 text-white">
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-700 via-red-600 to-orange-500 font-sans">
      {/* Header remains for navigation */}
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a className="flex items-center">
              <Image src="/logo.png" alt="Site Logo" width={100} height={35} />
              <span className="ml-2 text-xl font-pokemon text-gray-700 hover:text-red-500">Home</span>
            </a>
          </Link>
          <h1 className="text-2xl font-pokemon text-red-600 tracking-wide [text-shadow:_1px_1px_0_rgb(255_255_255_/_70%)]">Battle Lobby</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 text-white">
        {connecting ? (
          <div className="text-center">
            <Image src="/images/pokeball.jpg" alt="Loading..." width={80} height={80} unoptimized className="drop-shadow-lg animate-spin mx-auto mb-4" />
            <p className="font-pokemon text-2xl [text-shadow:_1px_1px_1px_rgb(0_0_0_/_30%)]">Connecting to Lobby...</p>
          </div>
        ) : error && !connecting && !players.length ? ( // Show connection error more prominently if it happens before any player data
          <div className="w-full max-w-md bg-red-700 bg-opacity-80 rounded-xl shadow-2xl p-8 text-center border-2 border-red-900">
            <h2 className="text-3xl font-pokemon text-yellow-300 mb-4 [text-shadow:_1px_1px_0_rgb(0_0_0_/_40%)]">Connection Error</h2>
            <p className="text-white mb-6 text-lg">{error}</p>
            <Link href="/play" legacyBehavior>
              <a className="bg-yellow-400 hover:bg-yellow-500 text-red-700 font-pokemon py-3 px-8 rounded-lg shadow-lg transition-colors text-xl border-2 border-yellow-600">
                Try Again
              </a>
            </Link>
          </div>
        ) : (
          // Main Lobby Card (Styled as per image)
          <div className="w-full max-w-2xl bg-pink-200 rounded-xl shadow-2xl overflow-hidden border-4 border-yellow-400">
            {/* Card Top Bar (Room ID) */}
            <div className="bg-red-500 p-6 text-center">
              <h2 className="text-4xl text-white font-pokemon tracking-wider mb-2 [text-shadow:_2px_2px_0_rgb(0_0_0_/_20%)]">
                Room: {roomId}
              </h2>
              <button 
                onClick={copyRoomIdToClipboard}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 px-4 py-2 rounded-md text-sm font-bold shadow-md transition-colors border-2 border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                {copied ? "Copied!" : "Copy Room ID"}
              </button>
            </div>

            {/* Players & Actions Area */}
            <div className="p-6 bg-red-300 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Players List Panel */}
              <div className="md:col-span-2 bg-red-400 p-4 rounded-lg shadow-inner min-h-[150px]">
                <h3 className="text-2xl font-pokemon text-yellow-300 mb-4 text-center [text-shadow:_1px_1px_0_rgb(0_0_0_/_25%)]">Players ({players.length}/{MAX_PLAYERS})</h3>
                {players.length > 0 ? (
                  <ul className="space-y-2">
                    {players.map((player, index) => (
                      <li key={player.id} 
                          className={`flex items-center justify-between p-3 rounded-md shadow-sm 
                                      ${player.id === playerId ? 'bg-yellow-200 border-2 border-yellow-500' : 'bg-red-200 border border-red-300'}`}>
                        <div className="flex items-center">
                          <Image 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${(index % 151) + 1}.png`} 
                            alt="Player Avatar" width={36} height={36}
                            className={`rounded-full mr-2 p-0.5 ${player.id === playerId ? 'bg-yellow-100' : 'bg-red-100'}`}/>
                          <span className={`font-semibold ${player.id === playerId ? 'text-red-600' : 'text-gray-700'}`}>
                            {player.id} {player.isHost && <span className="text-xs text-yellow-700">(Host)</span>}
                          </span>
                        </div>
                        <div className="flex items-center">
                        {player.ready ? (
                            <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full flex items-center">
                               <svg className="w-3 h-3 mr-1 fill-current text-green-600" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                                READY
                            </span>
                            ) : (
                            <span className="text-xs font-bold text-red-700 bg-red-200 px-2 py-1 rounded-full">NOT READY</span>
                            )}
                            {isCurrentUserHost && player.id !== playerId && (
                                <button onClick={() => handleKickPlayer(player.id)}
                                        className="ml-2 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold py-1 px-1.5 rounded-sm shadow-sm transition-colors"
                                        title="Kick Player"> X </button>
                            )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-white font-semibold py-6 [text-shadow:_1px_1px_1px_rgb(0_0_0_/_20%)]">Waiting for players to join...</p>
                )}
              </div>

              {/* Actions Panel */}
              <div className="md:col-span-1 bg-red-400 p-4 rounded-lg shadow-inner flex flex-col justify-center items-center min-h-[150px]">
                <h3 className="text-2xl font-pokemon text-yellow-300 mb-3 text-center [text-shadow:_1px_1px_0_rgb(0_0_0_/_25%)]">Actions</h3>
                {error && !connecting && (
                    <p className="text-yellow-200 text-xs bg-red-600 p-2 rounded-md text-center mb-2 shadow-md">{error}</p>
                )}
                {!currentPlayer?.ready && (
                  <button 
                    onClick={handleReadyUp}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-pokemon py-3 px-4 rounded-lg shadow-md transition-colors duration-200 border-2 border-green-700 hover:border-green-800 text-lg tracking-wider [text-shadow:_1px_1px_1px_rgb(0_0_0_/_30%)] focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    Ready Up!
                  </button>
                )}
                {isCurrentUserHost && (
                  <button 
                    onClick={handleStartGame}
                    disabled={!allPlayersPresentAndReady}
                    className="w-full mt-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 disabled:text-gray-600 disabled:border-gray-500 text-red-700 font-pokemon py-3 px-4 rounded-lg shadow-md transition-colors duration-200 border-2 border-yellow-600 hover:border-yellow-700 text-lg tracking-wider [text-shadow:_1px_1px_0px_rgb(255_255_255_/_30%)] focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  >
                    Start Game
                  </button>
                )}
                 <p className="text-xs text-center text-red-100 mt-4 [text-shadow:_1px_1px_0_rgb(0_0_0_/_20%)]">
                  {isCurrentUserHost ? 
                    (allPlayersPresentAndReady ? 'All set! Start the game!' : `Waiting for ${MAX_PLAYERS - players.length} more player(s) or for players to ready up.`)
                    : 
                    (currentPlayer?.ready ? 'Waiting for host to start...' : 'Click Ready Up when you are set!')}
                </p>
              </div>
            </div>
          </div>
        )}
        <footer className="w-full py-8 text-center text-white/80 text-sm">
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-700 via-red-600 to-orange-500 p-4 text-white">
      <div className="text-center">
        <Image src="/images/pokeball.jpg" alt="Loading Lobby..." width={80} height={80} unoptimized className="drop-shadow-lg animate-spin mx-auto mb-4" />
        <p className="font-pokemon text-2xl [text-shadow:_1px_1px_1px_rgb(0_0_0_/_30%)]">Loading Lobby...</p>
        <p className="text-sm text-yellow-200">Please wait while we connect you.</p>
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