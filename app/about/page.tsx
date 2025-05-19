"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-red-100"> {/* Using a lighter red for the page background */}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a>
              <Image src="/logo.png" alt="Small Logo" width={120} height={40} />
            </a>
          </Link>
          <nav className="space-x-4 font-pokemon">
            {['Home', 'About', 'Games', 'Features', 'Contact'].map((item) => (
              <Link key={item} href={item === 'Home' ? '/' : `/${item.toLowerCase()}`} legacyBehavior>
                <a className={`text-gray-700 hover:text-pokemon-red ${item === 'About' ? 'text-pokemon-red font-bold' : ''}`}>
                  {item}
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-xl">
          <h1 className="text-5xl font-pokemon text-center text-pokemon-red mb-8 [text-shadow:_2px_2px_0px_#A00000]">
            About Our Pokémon Adventure
          </h1>
          
          <div className="space-y-6 text-lg text-gray-800 leading-relaxed">
            <p>
              Welcome to Pokémon PvP Battle, the ultimate destination for trainers seeking thrilling Pokémon battles based on the classic FireRed mechanics! 
              Our project was born from a passion for the Pokémon world and a desire to create a dynamic platform where trainers can test their skills,
              strategize with their favorite Pokémon, and connect with a vibrant community.
            </p>
            <p>
              This platform is a fan-created endeavor, built with modern web technologies to bring you a seamless and engaging battle experience. 
              We've poured our hearts into recreating the strategic depth of Pokémon battles, allowing you to build your dream team,
              select your moves carefully, and outwit your opponents.
            </p>
            
            <div className="text-center my-10">
              <Image src="/images/staff_placeholder.png" alt="Our Team - Pokémon Trainers" width={400} height={250} className="mx-auto rounded-lg shadow-md" />
              <p className="text-sm text-gray-600 mt-2 italic">Meet the dedicated trainers behind this project!</p>
            </div>

            <h2 className="text-3xl font-pokemon text-center text-red-700 mt-12 mb-6 [text-shadow:_1px_1px_0px_#D00000]">
              Our Mission
            </h2>
            <p>
              Our mission is to provide a fun, fair, and competitive environment for Pokémon enthusiasts. We aim to:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2 text-pokemon-black">
              <li><span className="font-bold text-fire">Deliver</span> an authentic Pokémon battle experience.</li>
              <li><span className="font-bold text-water">Foster</span> a welcoming and active community of trainers.</li>
              <li><span className="font-bold text-grass">Continuously improve</span> and expand the platform with new features and Pokémon.</li>
              <li><span className="font-bold text-electric">Promote</span> strategic thinking and sportsmanship.</li>
            </ul>

            <p className="mt-8">
              Whether you're a seasoned Pokémon master or a new trainer starting your journey, we're excited to have you here. 
              Prepare your team, study your type matchups, and get ready to battle!
            </p>
            <p className="text-center font-pokemon text-xl text-pokemon-red mt-10">
              Gotta Catch 'Em All... and Battle 'Em All!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-center text-gray-400 text-sm">
        <p>Pokémon © Nintendo, Creatures Inc., GAME FREAK inc. This is a fan-created project for fun and learning.</p>
        <div className="flex justify-center space-x-3 mt-3">
            {/* Assuming you have these images in public/images/ or update paths */}
            <Image src="/images/pokeball.jpg" alt="Pokeball" width={20} height={20} className="opacity-70 hover:opacity-100"/>
            <Image src="/images/pokeball.jpg" alt="Pokeball" width={20} height={20} className="opacity-70 hover:opacity-100"/>
            <Image src="/images/pokeball.jpg" alt="Pokeball" width={20} height={20} className="opacity-70 hover:opacity-100"/>
        </div>
      </footer>
    </div>
  );
} 