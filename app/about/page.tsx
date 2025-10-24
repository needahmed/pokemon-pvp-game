"use client"

import { GrassWavesBackground } from '@/components/animations/GrassWaves'
import { Navigation } from '@/components/ui/shared/Navigation'
import { Footer } from '@/components/ui/shared/Footer'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 to-bg-darker">
      <Navigation />
      
      {/* Hero Section - Nature Theme */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        {/* Nature Animation Layers */}
        <div className="absolute inset-0">
          <GrassWavesBackground />
          <div className="absolute inset-0 opacity-5">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-4xl animate-float opacity-20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              >
                🍃
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-32">
          <div className="max-w-4xl mx-auto">
            {/* Organic Shape Header */}
            <div className="relative inline-block mb-12">
              <div 
                className="absolute -inset-8 blur-3xl opacity-30 rounded-full"
                style={{ background: 'var(--grass-glow)' }}
              />
              <h1 className="relative text-5xl md:text-7xl font-display font-black text-white">
                OUR{' '}
                <span style={{ color: 'var(--grass-accent)' }}>STORY</span>
              </h1>
            </div>

            {/* Story Content */}
            <div className="space-y-8 text-gray-200 font-body text-lg leading-relaxed">
              <p className="animate-fade-in-up">
                Pokemon PVP was born from a passion for Pokemon and modern web development. 
                We wanted to create an experience that brings the excitement of Pokemon battles 
                to the web with real-time multiplayer capabilities.
              </p>
              
              <p className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Built with cutting-edge technologies like Next.js 15, React 19, Socket.IO, and MongoDB, 
                this project showcases what&apos;s possible when you combine classic Pokemon battle mechanics 
                with modern web architecture.
              </p>

              <p className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                Our goal is to provide a free, open-source platform where trainers can battle with 
                their favorite Pokemon, complete with authentic damage calculations, type effectiveness, 
                and all the mechanics you know and love from the games.
              </p>
            </div>

            {/* Animated Timeline */}
            <div className="space-y-16 mt-20">
              <TimelineItem
                year="2024"
                title="The Beginning"
                description="Born from a passion for Pokemon and web development"
                icon="🌱"
                delay="0s"
              />
              <TimelineItem
                year="Now"
                title="The Journey"
                description="Building the ultimate online Pokemon battle experience"
                icon="🌿"
                delay="0.2s"
              />
              <TimelineItem
                year="Future"
                title="The Vision"
                description="Expanding to tournaments, rankings, and more Pokemon generations"
                icon="🌳"
                delay="0.4s"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-32 bg-gradient-to-b from-bg-dark to-bg-darker relative">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display font-black text-center mb-20 text-white">
            BUILT WITH{' '}
            <span style={{ color: 'var(--grass-accent)' }}>MODERN TECH</span>
          </h2>

          {/* Tech Stack Cards */}
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <TechStackCard
              name="Next.js 15"
              icon="▲"
              description="React framework for production"
            />
            <TechStackCard
              name="Socket.IO"
              icon="🔌"
              description="Real-time bidirectional communication"
            />
            <TechStackCard
              name="MongoDB"
              icon="🍃"
              description="NoSQL database for flexibility"
            />
            <TechStackCard
              name="TypeScript"
              icon="TS"
              description="Type-safe development"
            />
          </div>

          {/* Feature Highlights */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h3 className="text-3xl font-display font-bold text-center mb-12 text-white">
              Key Features
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <FeatureHighlight
                icon="⚔️"
                title="Real-time Battles"
                description="Socket.IO powered instant multiplayer"
              />
              <FeatureHighlight
                icon="🎯"
                title="Authentic Mechanics"
                description="Full damage calculation with type effectiveness"
              />
              <FeatureHighlight
                icon="📊"
                title="386 Pokemon"
                description="Complete Gen 1-3 roster available"
              />
              <FeatureHighlight
                icon="🌐"
                title="Cross-platform"
                description="Works on desktop, tablet, and mobile"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function TimelineItem({ 
  year, 
  title, 
  description, 
  icon,
  delay 
}: { 
  year: string
  title: string
  description: string
  icon: string
  delay: string
}) {
  return (
    <div 
      className="relative flex gap-8 items-start animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex-shrink-0">
        <div 
          className="w-20 h-20 rounded-full glass-card flex items-center justify-center text-4xl"
          style={{ borderColor: 'var(--grass-accent)', borderWidth: '2px' }}
        >
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <div 
          className="text-sm font-display font-bold mb-2"
          style={{ color: 'var(--grass-accent)' }}
        >
          {year}
        </div>
        <h3 className="text-2xl font-display font-bold text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-300 font-body">
          {description}
        </p>
      </div>
    </div>
  )
}

function TechStackCard({ name, icon, description }: { name: string; icon: string; description: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-all duration-300 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-display font-bold text-white mb-2">
        {name}
      </h3>
      <p className="text-gray-400 text-sm font-body">
        {description}
      </p>
    </div>
  )
}

function FeatureHighlight({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="glass-card p-6 rounded-xl hover:scale-105 transition-transform">
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h4 className="text-lg font-display font-bold text-white mb-1">
            {title}
          </h4>
          <p className="text-gray-400 text-sm font-body">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
