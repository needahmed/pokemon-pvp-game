"use client"

import { useState, useEffect, useRef } from "react"

interface AudioPlayerProps {
  src: string
  loop?: boolean
  autoPlay?: boolean
}

export default function AudioPlayer({ src, loop = false, autoPlay = true }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element
    const audio = new Audio(src)
    audio.loop = loop
    audioRef.current = audio

    // Set up event listeners
    audio.addEventListener("ended", () => setIsPlaying(false))

    // Start playing if autoPlay is true
    if (autoPlay) {
      audio.play().catch((error) => {
        console.error("Error auto-playing audio:", error)
        setIsPlaying(false)
      })
    }

    // Clean up
    return () => {
      audio.pause()
      audio.removeEventListener("ended", () => setIsPlaying(false))
    }
  }, [src, loop, autoPlay])

  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  // Method to play a sound effect (can be called from parent components through a ref)
  const playSoundEffect = (soundSrc: string) => {
    try {
      const effectAudio = new Audio(soundSrc)
      effectAudio.loop = false
      effectAudio.play().catch(err => {
        console.error("Error playing sound effect:", err)
      })
    } catch (error) {
      console.error("Error with sound effect:", error)
    }
  }

  // Expose the playSoundEffect method
  useEffect(() => {
    // This can be accessed from the parent component if needed
    if (typeof window !== 'undefined') {
      (window as any).playSoundEffect = playSoundEffect
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).playSoundEffect
      }
    }
  }, [])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={togglePlay}
        className="bg-white bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-all"
        aria-label={isPlaying ? "Mute" : "Unmute"}
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        )}
      </button>
    </div>
  )
}
