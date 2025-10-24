"use client"

import Link from 'next/link'
import Image from 'next/image'
import { FireParticles } from '@/components/animations/FireParticles'
import { Navigation } from '@/components/ui/shared/Navigation'
import { Footer } from '@/components/ui/shared/Footer'
import SoundToggle from '@/components/SoundToggle'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-darker">
      <Navigation />
      
      {/* Hero Section - Fire Theme */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-fire animate-gradient-shift" />
          <FireParticles count={80} />
          <div className="absolute inset-0 cyber-grid opacity-10" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 container mx-auto">
          {/* Animated Logo with Flame Aura */}
          <div className="relative group mb-8">
            <div 
              className="absolute -inset-8 blur-3xl group-hover:blur-4xl transition-all duration-500 animate-pulse-glow opacity-50" 
              style={{ background: 'var(--fire-glow)' }}
            />
            <Image 
              src="/logo.png" 
              alt="Pokemon PVP" 
              width={500}
              height={250}
              className="relative drop-shadow-2xl animate-float mx-auto"
              priority
            />
          </div>

          {/* Tagline with Shimmer Effect */}
          <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-6 animate-fade-in-up">
            BATTLE IN THE{' '}
            <span 
              className="text-transparent bg-clip-text animate-text-shimmer"
              style={{ 
                backgroundImage: 'linear-gradient(to right, var(--fire-primary), var(--fire-accent), var(--fire-primary))',
                backgroundSize: '200% auto'
              }}
            >
              FLAMES
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl font-body text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
            Enter the ultimate{' '}
            <span className="font-bold" style={{ color: 'var(--fire-accent)' }}>
              real-time Pokemon battle arena
            </span>
            . Challenge trainers worldwide in epic 6v6 battles with full type mechanics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up-delayed">
            <Link
              href="/play"
              className="group relative px-12 py-6 font-display font-bold text-xl md:text-2xl overflow-hidden rounded-2xl transition-all duration-300 hover:scale-110"
            >
              <div 
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, var(--fire-primary), var(--fire-accent))' }}
              />
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--fire-gradient)' }}
              />
              <span className="relative z-10 text-white drop-shadow-glow">
                ⚔️ BATTLE NOW
              </span>
            </Link>

            <Link
              href="/about"
              className="group relative px-12 py-6 font-display font-bold text-xl md:text-2xl glass-button rounded-2xl border-2 hover:border-white transition-all duration-300 hover:scale-105"
              style={{ borderColor: 'var(--fire-accent)' }}
            >
              <span className="text-white">📖 LEARN MORE</span>
            </Link>
          </div>

          {/* Stats Counter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-20 animate-fade-in-up-delayed-2 max-w-4xl mx-auto">
            <StatCard value="10K+" label="BATTLES" icon="⚔️" />
            <StatCard value="1.5K+" label="TRAINERS" icon="👤" />
            <StatCard value="386" label="POKEMON" icon="⚡" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:flex">
          <div 
            className="w-6 h-10 border-2 rounded-full flex items-start justify-center p-2"
            style={{ borderColor: 'var(--fire-accent)' }}
          >
            <div 
              className="w-1 h-3 rounded-full animate-scroll-indicator"
              style={{ backgroundColor: 'var(--fire-accent)' }}
            />
          </div>
        </div>
      </section>

      {/* Features Preview Section */}
      <section className="py-32 bg-bg-darker relative">
        {/* Background Glow Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[150px] opacity-20 animate-pulse-slow"
            style={{ background: 'var(--fire-glow)' }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-black text-center mb-6 text-white">
            BATTLE{' '}
            <span style={{ color: 'var(--fire-accent)' }}>FEATURES</span>
          </h2>
          <p className="text-xl text-gray-300 text-center mb-20 max-w-3xl mx-auto">
            Experience Pokemon battles like never before with cutting-edge mechanics
          </p>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="⚡"
              title="REAL-TIME BATTLES"
              description="Fight in live 6v6 battles with instant turn-based action"
            />
            <FeatureCard
              icon="🎯"
              title="TYPE MECHANICS"
              description="Full type effectiveness, STAB, and critical hit calculations"
            />
            <FeatureCard
              icon="🌐"
              title="ONLINE MULTIPLAYER"
              description="Create rooms, invite friends, battle trainers worldwide"
            />
          </div>
        </div>
      </section>

      <Footer />
      <SoundToggle />
    </main>
  )
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-4xl md:text-5xl font-display font-black text-white mb-2">
        {value}
      </div>
      <div className="text-gray-400 font-body text-lg">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-300 group">
      <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold text-white mb-4">
        {title}
      </h3>
      <p className="text-gray-300 font-body leading-relaxed">
        {description}
      </p>
    </div>
  )
}
