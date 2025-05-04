"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Home() {
  const router = useRouter()
  const [roomId, setRoomId] = useState("")
  const [playerId, setPlayerId] = useState("")
  const [error, setError] = useState("")

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError("Room ID is required.")
      return
    }

    if (!playerId.trim()) {
      setError("Player ID is required.")
      return
    }

    // Go to lobby page instead of directly to team selection
    router.push(`/lobby?roomId=${roomId}&playerId=${playerId}`)
  }

  const handleCreateRoom = () => {
    if (!playerId.trim()) {
      setError("Player ID is required.")
      return
    }

    // Generate a random room ID (could be more sophisticated)
    const newRoomId = Math.random().toString(36).substring(2, 8)
    setRoomId(newRoomId)
    
    // Go to lobby page
    router.push(`/lobby?roomId=${newRoomId}&playerId=${playerId}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-red-500 to-red-700">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-red-600 p-6 text-center">
          <h1 className="text-3xl text-white font-pokemon mb-2">Pokémon PvP</h1>
          <p className="text-white text-opacity-80 text-sm">Battle your friends with your favorite Pokémon!</p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 font-pokemon text-sm mb-2">
              Player ID
            </label>
            <input
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-pokemon text-sm mb-2">
              Room ID
            </label>
            <div className="flex">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room code"
                className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleCreateRoom}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-r-lg font-pokemon text-sm"
              >
                Create
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter an existing room ID or create a new one
            </p>
          </div>
          
          <button
            onClick={handleJoinRoom}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-pokemon py-3 px-4 rounded-lg shadow-md transition-colors duration-200"
          >
            Join Battle
          </button>
        </div>
        
        <div className="bg-gray-100 p-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
            <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-600">Fan-made project, not affiliated with Pokémon.</p>
        </div>
      </div>
    </main>
  )
}
