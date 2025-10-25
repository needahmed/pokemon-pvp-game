"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Sparkles, Rocket, AlertTriangle, Compass } from "lucide-react"
import SoundToggle from "@/components/SoundToggle"
import { PortalVortex } from "@/components/animations/PortalVortex"
import { FloatingPokemonSilhouettes } from "@/components/animations/FloatingPokemonSilhouettes"
import { SpaceParticles } from "@/components/animations/SpaceParticles"

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
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black relative overflow-hidden">
      {/* Animated background effects */}
      <SpaceParticles count={200} />
      <PortalVortex centered />
      <FloatingPokemonSilhouettes count={10} />
      
      {/* Dimensional Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="cyber-grid w-full h-full" />
      </div>

      {/* Header */}
      <header className="relative z-50 bg-black/30 backdrop-blur-md shadow-md sticky top-0 border-b border-portal-primary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a className="flex items-center group">
              <Image src="/logo.png" alt="Site Logo" width={100} height={35} />
              <span className="ml-2 text-xl font-pokemon text-portal-accent hover:text-portal-primary transition-colors">Home</span>
            </a>
          </Link>
          <h1 className="text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-portal-primary via-portal-accent to-portal-primary">
            THE PORTAL
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 min-h-screen flex items-center justify-center">
        {/* Outer glow ring */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-pink-500/30 blur-3xl animate-pulse-portal opacity-30 pointer-events-none" />
        
        {/* Main card with glassmorphism */}
        <div className="relative w-full max-w-xl">
          {/* Holographic border effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-portal-primary via-portal-accent to-portal-secondary rounded-3xl opacity-75 blur animate-tilt"></div>
          
          {/* Card content */}
          <div className="relative bg-gray-900/90 backdrop-blur-2xl rounded-3xl border-2 border-portal-primary/50 p-12 shadow-2xl">
            
            {/* Header with animated portal icon */}
            <div className="text-center mb-8">
              <div className="inline-block relative mb-6">
                {/* Spinning portal rings around icon */}
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="w-32 h-32 border-4 border-portal-primary border-t-transparent rounded-full"></div>
                </div>
                <div className="absolute inset-2 animate-spin-reverse">
                  <div className="w-28 h-28 border-4 border-portal-accent border-b-transparent rounded-full"></div>
                </div>
                
                {/* Center portal icon */}
                <div className="relative z-10 w-32 h-32 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-portal-primary to-portal-accent rounded-full animate-pulse shadow-lg shadow-portal-primary/50">
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <Compass className="w-10 h-10" />
                    </div>
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl font-display font-black mb-3 bg-gradient-to-r from-portal-primary via-portal-accent to-portal-secondary bg-clip-text text-transparent animate-shine bg-[length:200%_auto]">
                ENTER THE ARENA
              </h1>
              <p className="text-portal-accent font-tech text-sm tracking-wider">
                &gt; INITIALIZING BATTLE PROTOCOL
              </p>
            </div>

            {/* Player ID Input with holographic effect */}
            <div className="mb-6 group">
              <label className="block text-sm font-tech text-portal-accent mb-2 uppercase tracking-wide">
                Trainer ID
              </label>
              <div className="relative">
                {/* Input glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-portal-primary to-portal-accent rounded-lg opacity-0 group-focus-within:opacity-75 blur transition-opacity"></div>
                
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => {
                    setPlayerId(e.target.value);
                    if (error && e.target.value.trim()) setError("");
                  }}
                  placeholder="Enter your trainer name..."
                  className="relative w-full px-6 py-4 bg-black/50 border-2 border-portal-primary/30 rounded-lg text-white placeholder-gray-500 font-body text-lg focus:border-portal-accent focus:outline-none transition-all"
                />
                
                {/* Scanning line effect on focus */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                  <div className="scan-line opacity-0 group-focus-within:opacity-100 group-focus-within:animate-scan-down"></div>
                </div>
              </div>
            </div>

            {/* Room ID Input with similar styling */}
            <div className="mb-8 group">
              <label className="block text-sm font-tech text-portal-accent mb-2 uppercase tracking-wide">
                Room Code
              </label>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-portal-accent to-portal-secondary rounded-lg opacity-0 group-focus-within:opacity-75 blur transition-opacity"></div>
                
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value.toUpperCase());
                    if (error && e.target.value.trim()) setError("");
                  }}
                  placeholder="Enter 6-digit code or leave empty..."
                  className="relative w-full px-6 py-4 bg-black/50 border-2 border-portal-accent/30 rounded-lg text-white placeholder-gray-500 font-body text-lg focus:border-portal-primary focus:outline-none transition-all tracking-widest"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Create Room Button */}
              <button
                onClick={handleCreateRoom}
                disabled={!playerId.trim()}
                className="group relative w-full overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-portal-primary via-portal-secondary to-portal-accent"></div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                
                {/* Energy sweep on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                
                {/* Button content */}
                <div className="relative px-8 py-5 flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <span className="font-display font-bold text-xl text-white tracking-wide">
                    CREATE NEW PORTAL
                  </span>
                  <Sparkles className="w-6 h-6" />
                </div>
              </button>

              {/* Join Room Button */}
              <button
                onClick={handleJoinRoom}
                disabled={!playerId.trim() || !roomId.trim()}
                className="group relative w-full overflow-hidden rounded-xl border-2 border-portal-accent transition-all duration-300 hover:scale-105 hover:border-portal-primary disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {/* Glass background */}
                <div className="absolute inset-0 bg-gradient-to-r from-portal-accent/20 to-portal-primary/20 backdrop-blur-sm"></div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                
                {/* Button content */}
                <div className="relative px-8 py-5 flex items-center justify-center gap-3">
                  <Rocket className="w-6 h-6" />
                  <span className="font-display font-bold text-xl text-white tracking-wide">
                    ENTER PORTAL
                  </span>
                  <Rocket className="w-6 h-6" />
                </div>
              </button>
            </div>

            {/* Error message with glitch effect */}
            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg backdrop-blur-sm animate-shake">
                <p className="text-red-300 text-center font-tech text-sm flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Footer hint */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm font-tech">
                &gt; SECURE CONNECTION ESTABLISHED
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-mono">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-6 text-center text-white/70 text-sm">
        <p>Pokémon © Nintendo, Creatures Inc., GAME FREAK inc. This is a fan-created project.</p>
      </footer>
      
      {/* Sound Toggle */}
      <SoundToggle />
    </div>
  )
}
