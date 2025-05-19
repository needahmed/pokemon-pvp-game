"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function PlayPage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState("")
  const [playerId, setPlayerId] = useState("")
  const [error, setError] = useState("")

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError("Room ID is required to join.")
      return
    }
    if (!playerId.trim()) {
      setError("Player ID is required to join a room.")
      return
    }
    router.push(`/lobby?roomId=${roomId}&playerId=${playerId}`)
  }

  const handleCreateRoom = () => {
    if (!playerId.trim()) {
      setError("Player ID is required to create a room.")
      return
    }
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/lobby?roomId=${newRoomId}&playerId=${playerId}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-600 via-red-500 to-yellow-400">
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a className="flex items-center">
              <Image src="/logo.png" alt="Site Logo" width={100} height={35} />
              <span className="ml-2 text-xl font-pokemon text-gray-700 hover:text-red-500">Home</span>
            </a>
          </Link>
          <h1 className="text-2xl font-pokemon text-red-600 tracking-wide [text-shadow:_1px_1px_0_rgb(255_255_255_/_70%)]">Game Lobby</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white/30 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400/50">
          <div className="bg-red-600/80 p-6 text-center border-b-2 border-yellow-400/50">
            <h2 className="text-3xl text-white font-pokemon tracking-wider mb-1 [text-shadow:_2px_2px_0_rgb(0_0_0_/_30%)]">
              Prepare for Battle!
            </h2>
            <p className="text-yellow-300 text-sm [text-shadow:_1px_1px_0_rgb(0_0_0_/_30%)]">
              Enter your Player ID and join or create a room.
            </p>
          </div>
          
          <div className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="bg-red-700/90 border border-red-900 text-white px-4 py-3 rounded-lg text-center font-medium shadow-md">
                <p>{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="playerId" className="block text-yellow-300 font-pokemon text-md mb-2 [text-shadow:_1px_1px_0_rgb(0_0_0_/_40%)]">
                Player ID
              </label>
              <input
                id="playerId"
                type="text"
                value={playerId}
                onChange={(e) => {
                  setPlayerId(e.target.value);
                  if (error && e.target.value.trim()) setError("");
                }}
                placeholder="Enter your trainer name"
                className="w-full px-4 py-3 bg-white/70 border-2 border-yellow-500 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-600 shadow-sm transition-all duration-200 font-medium"
              />
            </div>
            
            <div>
              <label htmlFor="roomId" className="block text-yellow-300 font-pokemon text-md mb-2 [text-shadow:_1px_1px_0_rgb(0_0_0_/_40%)]">
                Room ID (to Join)
              </label>
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value.toUpperCase());
                  if (error && e.target.value.trim()) setError("");
                }}
                placeholder="Enter room code (e.g., A1B2C3)"
                className="w-full px-4 py-3 bg-white/70 border-2 border-yellow-500 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-600 shadow-sm transition-all duration-200 font-medium tracking-wider"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 pt-2">
              <button
                onClick={handleCreateRoom}
                disabled={!playerId.trim()}
                className="w-full sm:flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-pokemon py-3 px-4 rounded-lg shadow-lg transition-colors duration-200 transform hover:scale-105 text-lg tracking-wide border-2 border-green-700 disabled:border-gray-500 [text-shadow:_1px_1px_1px_rgb(0_0_0_/_30%)]"
              >
                Create New Room
              </button>
              <button
                onClick={handleJoinRoom}
                disabled={!playerId.trim() || !roomId.trim()}
                className="w-full sm:flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-red-700 font-pokemon py-3 px-4 rounded-lg shadow-lg transition-colors duration-200 transform hover:scale-105 text-lg tracking-wide border-2 border-yellow-700 disabled:border-gray-500 [text-shadow:_1px_1px_1px_rgb(255_255_255_/_20%)]"
              >
                Join Room
              </button>
            </div>
            <p className="text-xs text-white/80 text-center mt-2 [text-shadow:_1px_1px_0_rgb(0_0_0_/_20%)]">
              Create a room if you don't have a code, or enter one to join an existing battle!
            </p>
          </div>
        </div>
         <footer className="w-full py-6 text-center text-white/70 text-sm mt-8">
            <p>Pokémon © Nintendo, Creatures Inc., GAME FREAK inc. This is a fan-created project.</p>
        </footer>
      </main>
    </div>
  )
} 