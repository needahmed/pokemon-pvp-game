"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import io, { Socket } from "socket.io-client"

// Sample Pokémon data for testing
const samplePokemon = [
  {
    id: 25,
    name: "pikachu",
    types: ["electric"],
    stats: { hp: 35, attack: 55, defense: 40, speed: 90 },
    currentHp: 35,
    sprites: {
      front: "/sprites/pikachu-front.png",
      back: "/sprites/pikachu-back.png",
      icon: "/icons/25_icon.png"
    },
    moves: [
      { name: "tackle", power: 40, type: "normal", accuracy: 100 },
      { name: "thunderbolt", power: 90, type: "electric", accuracy: 100 },
      { name: "quick attack", power: 40, type: "normal", accuracy: 100 },
      { name: "thunder", power: 110, type: "electric", accuracy: 70 }
    ]
  },
  {
    id: 4,
    name: "charmander",
    types: ["fire"],
    stats: { hp: 39, attack: 52, defense: 43, speed: 65 },
    currentHp: 39,
    sprites: {
      front: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
      back: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/4.png",
      icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/4.png"
    },
    moves: [
      { name: "scratch", power: 40, type: "normal", accuracy: 100 },
      { name: "ember", power: 40, type: "fire", accuracy: 100 },
      { name: "flamethrower", power: 90, type: "fire", accuracy: 100 },
      { name: "fire spin", power: 35, type: "fire", accuracy: 85 }
    ]
  },
  {
    id: 1,
    name: "bulbasaur",
    types: ["grass", "poison"],
    stats: { hp: 45, attack: 49, defense: 49, speed: 45 },
    currentHp: 45,
    sprites: {
      front: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
      back: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png",
      icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/1.png"
    },
    moves: [
      { name: "tackle", power: 40, type: "normal", accuracy: 100 },
      { name: "vine whip", power: 45, type: "grass", accuracy: 100 },
      { name: "razor leaf", power: 55, type: "grass", accuracy: 95 },
      { name: "seed bomb", power: 80, type: "grass", accuracy: 100 }
    ]
  },
  {
    id: 7,
    name: "squirtle",
    types: ["water"],
    stats: { hp: 44, attack: 48, defense: 65, speed: 43 },
    currentHp: 44,
    sprites: {
      front: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
      back: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/7.png",
      icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/7.png"
    },
    moves: [
      { name: "tackle", power: 40, type: "normal", accuracy: 100 },
      { name: "water gun", power: 40, type: "water", accuracy: 100 },
      { name: "bubble", power: 40, type: "water", accuracy: 100 },
      { name: "water pulse", power: 60, type: "water", accuracy: 100 }
    ]
  },
  {
    id: 133,
    name: "eevee",
    types: ["normal"],
    stats: { hp: 55, attack: 55, defense: 50, speed: 55 },
    currentHp: 55,
    sprites: {
      front: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png",
      back: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/133.png",
      icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/133.png"
    },
    moves: [
      { name: "tackle", power: 40, type: "normal", accuracy: 100 },
      { name: "quick attack", power: 40, type: "normal", accuracy: 100 },
      { name: "bite", power: 60, type: "dark", accuracy: 100 },
      { name: "swift", power: 60, type: "normal", accuracy: 100 }
    ]
  },
  {
    id: 143,
    name: "snorlax",
    types: ["normal"],
    stats: { hp: 160, attack: 110, defense: 65, speed: 30 },
    currentHp: 160,
    sprites: {
      front: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png",
      back: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/143.png",
      icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/143.png"
    },
    moves: [
      { name: "body slam", power: 85, type: "normal", accuracy: 100 },
      { name: "earthquake", power: 100, type: "ground", accuracy: 100 },
      { name: "hyper beam", power: 150, type: "normal", accuracy: 90 },
      { name: "crunch", power: 80, type: "dark", accuracy: 100 }
    ]
  }
];

// Global socket connection
let socket: Socket | null = null;

export default function TestPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("test-room-123");
  const [player1Id, setPlayer1Id] = useState("player1");
  const [player2Id, setPlayer2Id] = useState("player2");
  const [log, setLog] = useState<string[]>(["Test page loaded..."]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [battling, setBattling] = useState(false);

  // Add a log message
  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Initialize socket connection
  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:4000");

      socket.on("connect", () => {
        addLog(`Socket connected: ${socket?.id}`);
        setSocketConnected(true);
      });

      socket.on("connect_error", (err) => {
        addLog(`Socket connection error: ${err.message}`);
        setSocketConnected(false);
      });

      socket.on("disconnect", (reason) => {
        addLog(`Socket disconnected: ${reason}`);
        setSocketConnected(false);
      });

      // Handle events from the server
      socket.on("playerJoined", (data) => {
        addLog(`Player joined: ${data.playerId} in room ${data.roomId}`);
      });

      socket.on("startTeamSelection", (data) => {
        addLog(`Team selection started for room ${data.roomId}`);
      });

      socket.on("startBattle", (data) => {
        addLog(`Battle starting in room ${data.roomId}`);
        setBattling(true);
      });

      socket.on("forceRedirect", (data) => {
        addLog(`Redirect received to: ${data.url}`);
      });

      socket.on("battleState", (data) => {
        addLog(`Battle state received for room ${data.roomId}`);
      });

      socket.on("battleUpdate", (data) => {
        addLog(`Battle update: ${JSON.stringify(data)}`);
      });
    }

    return () => {
      // Clean up event listeners but don't disconnect
      if (socket) {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("playerJoined");
        socket.off("startTeamSelection");
        socket.off("startBattle");
        socket.off("forceRedirect");
        socket.off("battleState");
        socket.off("battleUpdate");
      }
    };
  }, []);

  // Create a room with both players
  const setupRoom = () => {
    if (!socket || !socket.connected) {
      addLog("Socket not connected. Can't setup room.");
      return;
    }

    // First player joins
    socket.emit("joinRoom", { roomId, playerId: player1Id });
    addLog(`Sending joinRoom for player 1: ${player1Id}`);

    // Second player joins
    setTimeout(() => {
      if (socket) {
        socket.emit("joinRoom", { roomId, playerId: player2Id });
        addLog(`Sending joinRoom for player 2: ${player2Id}`);
      }
    }, 500);
  };

  // Submit teams for both players
  const submitTeams = () => {
    if (!socket || !socket.connected) {
      addLog("Socket not connected. Can't submit teams.");
      return;
    }

    // Submit team for player 1
    socket.emit("submitTeam", {
      roomId,
      playerId: player1Id,
      team: samplePokemon
    });
    addLog(`Submitting team for player 1: ${player1Id}`);

    // Submit team for player 2 (slightly different order just to make it interesting)
    setTimeout(() => {
      if (socket) {
        const player2Team = [...samplePokemon].reverse();
        socket.emit("submitTeam", {
          roomId,
          playerId: player2Id,
          team: player2Team
        });
        addLog(`Submitting team for player 2: ${player2Id}`);
      }
    }, 500);
  };

  // Go to battle page as player 1
  const goToBattle = (playerId: string) => {
    router.push(`/battle?roomId=${roomId}&playerId=${playerId}`);
  };

  // Clear log
  const clearLog = () => {
    setLog([]);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Battle Test Page</h1>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center mb-4">
          <div className={`w-4 h-4 rounded-full mr-2 ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{socketConnected ? 'Connected to server' : 'Disconnected'}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 ID</label>
            <input
              type="text"
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 ID</label>
            <input
              type="text"
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={setupRoom}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            disabled={!socketConnected}
          >
            1. Create Room with Both Players
          </button>
          
          <button 
            onClick={submitTeams}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            disabled={!socketConnected}
          >
            2. Submit Teams for Both Players
          </button>
          
          <button 
            onClick={() => goToBattle(player1Id)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
            disabled={!battling}
          >
            3. Go to Battle as Player 1
          </button>
          
          <button 
            onClick={() => goToBattle(player2Id)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md"
            disabled={!battling}
          >
            Go to Battle as Player 2
          </button>
        </div>
      </div>
      
      <div className="bg-black text-green-400 rounded-lg shadow-md p-4 h-96 overflow-y-auto font-mono text-sm">
        <div className="flex justify-between mb-2">
          <h2 className="text-white font-bold">Event Log</h2>
          <button 
            onClick={clearLog}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear Log
          </button>
        </div>
        {log.map((entry, index) => (
          <div key={index} className="mb-1">{entry}</div>
        ))}
      </div>
    </div>
  );
} 