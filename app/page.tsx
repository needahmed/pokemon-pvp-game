"use client"

import Link from 'next/link';
import Image from 'next/image';
import SoundToggle from '@/components/SoundToggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-green-400 page-transition">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a>
              <Image src="/logo.png" alt="Small Logo" width={120} height={40} />
            </a>
          </Link>
          <nav className="space-x-4">
            {["Home", "About", "Games", "Features", "Contact"].map((item) => (
              <Link key={item} href="#" legacyBehavior>
                <a className="text-gray-700 hover:text-red-500 font-medium">{item}</a>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
        {/* Placeholder for background elements (e.g., field, sky, characters) */}
        {/* You might want to use a large background image here if you have one */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-500 to-blue-300 z-0 opacity-70"></div>
        
        {/* Placeholder for Pikachu-like character */}
        <div className="absolute left-10 bottom-10 z-10 opacity-80 animate-bounce">
            {/* <Image src="/images/pikachu-placeholder.png" alt="Pikachu" width={200} height={200} /> */}
            <p className="text-6xl">ϞϞ(๑⚈ ․̫ ⚈๑)∩</p> {/* ASCII Art Pikachu as placeholder */}
        </div>

        {/* Placeholder for Master Ball-like object */}
        <div className="absolute right-10 bottom-10 z-10 opacity-80">
            {/* <Image src="/images/masterball-placeholder.png" alt="Master Ball" width={150} height={150} /> */}
            <div className="w-32 h-32 bg-purple-600 rounded-full border-4 border-black flex items-center justify-center">
                <div className="w-16 h-16 bg-pink-400 rounded-full border-2 border-black flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full"></div>
                </div>
            </div>
        </div>

        <div className="relative z-20 flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="Pokemon PVP Logo"
            width={450} 
            height={225}
            className="mb-6 drop-shadow-2xl"
            priority
          />
          <p className="text-xl text-white mb-10 max-w-xl [text-shadow:_1px_1px_2px_rgb(0_0_0_/_60%)] font-medium">
            The ultimate Pokémon battle experience awaits! Join trainers, build your team, and fight your way to the top.
          </p>
          <Link href="/play" legacyBehavior>
            <a className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-2xl py-4 px-16 rounded-lg shadow-xl transition-transform transform hover:scale-105 duration-300 ease-in-out font-pokemon tracking-wide border-2 border-yellow-700">
              PLAY NOW
            </a>
          </Link>
        </div>
      </main>

      {/* Secondary Section - "Preddmo all Part hriatsr tt" */}
      <section className="py-16 bg-gray-100 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 font-pokemon">Explore Features</h2> {/* Changed placeholder text */}
          <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
            Discover powerful Pokémon, customize your battle strategies, and connect with a vibrant community of trainers. More features coming soon!
          </p>
          <div className="flex justify-center space-x-6">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105 font-pokemon border-2 border-yellow-700">
              More Info
            </button>
            <button className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-lg shadow-md border-2 border-gray-300 transition-transform transform hover:scale-105 font-pokemon">
              Sign Up
            </button>
          </div>
        </div>
      </section>

      {/* Tertiary Section - "Pio Neors Library" */}
      <section className="py-12 bg-gray-800 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-3 font-pokemon">Developer Resources</h2> {/* Changed placeholder text */}
          <p className="text-gray-400">Access our API, documentation, and community forums.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-center text-gray-400 text-sm">
        <p>Pokémon © Nintendo, Creatures Inc., GAME FREAK inc. This is a fan-created project for fun and learning.</p>
        <div className="flex justify-center space-x-3 mt-3">
            <Image src="/images/pokeball.jpg" alt="Pokeball" width={20} height={20} className="opacity-70 hover:opacity-100"/>
            <Image src="/images/pokeball.jpg" alt="Pokeball" width={20} height={20} className="opacity-70 hover:opacity-100"/>
            <Image src="/images/pokeball.jpg" alt="Pokeball" width={20} height={20} className="opacity-70 hover:opacity-100"/>
        </div>
      </footer>
      
      {/* Sound Toggle */}
      <SoundToggle />
    </div>
  );
}
