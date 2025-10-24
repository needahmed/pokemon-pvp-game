"use client"

import { LightningBolts } from '@/components/animations/LightningBolts'
import { Navigation } from '@/components/ui/shared/Navigation'
import { Footer } from '@/components/ui/shared/Footer'

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-bg-darker">
      <Navigation />
      
      {/* Hero Section - Electric Theme */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        {/* Electric Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-electric animate-gradient-shift opacity-20" />
          <LightningBolts count={15} />
          <div className="absolute inset-0 cyber-grid opacity-30" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-32">
          <div className="text-center mb-20">
            <div className="inline-block relative">
              <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-4 glitch" data-text="FEATURES">
                FEATURES
              </h1>
              <div 
                className="absolute -bottom-2 left-0 right-0 h-1 animate-scan-line"
                style={{ background: 'var(--electric-gradient)' }}
              />
            </div>
            <p 
              className="text-xl md:text-2xl mt-6 font-tech"
              style={{ color: 'var(--electric-accent)' }}
            >
              &gt; ADVANCED BATTLE SYSTEM v2.0.0
            </p>
          </div>

          {/* Interactive Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <TechFeatureCard
              title="DAMAGE CALCULATION ENGINE"
              description="Authentic Gen 3 damage formula with all modifiers"
              code="damage = ((2 * level / 5 + 2) * power * attack / defense / 50 + 2) * STAB * typeEffectiveness * critical * random"
            />

            <TechFeatureCard
              title="TYPE EFFECTIVENESS MATRIX"
              description="18 types with full dual-type calculations"
              stats={[
                { label: "Type Matchups", value: "324" },
                { label: "Types", value: "18" },
                { label: "Calculations", value: "Real-time" }
              ]}
            />

            <TechFeatureCard
              title="WEBSOCKET MULTIPLAYER"
              description="Socket.IO powered real-time battles with low latency"
              stats={[
                { label: "Latency", value: "<50ms" },
                { label: "Concurrent", value: "100+" },
                { label: "Uptime", value: "99.9%" }
              ]}
            />

            <TechFeatureCard
              title="STAT CALCULATION"
              description="Base stats, EVs, IVs, and nature modifiers"
              code="((IV + 2 * Base + EV/4) * Level / 100) + 5"
            />
          </div>
        </div>
      </section>

      {/* Battle Mechanics Breakdown */}
      <section className="py-32 bg-bg-dark relative">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display font-black text-center mb-20 text-white">
            BATTLE{' '}
            <span style={{ color: 'var(--electric-accent)' }}>MECHANICS</span>
          </h2>

          {/* Mechanics Grid */}
          <div className="max-w-5xl mx-auto space-y-6">
            <MechanicCard
              icon="💥"
              title="Type Effectiveness"
              description="Complete type chart with super effective (2x), not very effective (0.5x), and no effect (0x) calculations. Dual-type Pokemon combine effectiveness multipliers."
              gradient="electric"
            />
            <MechanicCard
              icon="✨"
              title="STAB Bonus"
              description="Same-Type Attack Bonus (STAB) grants 1.5x damage when a Pokemon uses a move matching its type. Essential for maximizing damage output."
              gradient="fire"
            />
            <MechanicCard
              icon="🎯"
              title="Critical Hits"
              description="6.25% chance for critical hits that deal 1.5x damage. Ignores stat modifiers for more consistent damage during crucial moments."
              gradient="water"
            />
            <MechanicCard
              icon="🔄"
              title="Turn-Based System"
              description="Strategic turn-based combat where players choose moves or switch Pokemon. Turn order determined fairly with both players making simultaneous decisions."
              gradient="grass"
            />
          </div>
        </div>
      </section>

      {/* Pokemon Roster Showcase */}
      <section className="py-32 bg-gradient-to-b from-bg-dark to-bg-darker">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display font-black text-center mb-12 text-white">
            386 POKEMON{' '}
            <span style={{ color: 'var(--electric-accent)' }}>AVAILABLE</span>
          </h2>
          
          <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto">
            Battle with Pokemon from Generations 1-3, each with accurate stats, moves, and type matchups from the original games.
          </p>

          {/* Generation Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <GenerationCard
              gen="Gen I"
              region="Kanto"
              count="151"
              color="var(--fire-primary)"
            />
            <GenerationCard
              gen="Gen II"
              region="Johto"
              count="100"
              color="var(--electric-primary)"
            />
            <GenerationCard
              gen="Gen III"
              region="Hoenn"
              count="135"
              color="var(--water-primary)"
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function TechFeatureCard({ 
  title, 
  description, 
  code, 
  stats 
}: { 
  title: string
  description: string
  code?: string
  stats?: Array<{ label: string; value: string }>
}) {
  return (
    <div className="glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-300">
      <h3 className="text-2xl font-display font-bold text-white mb-4">
        {title}
      </h3>
      <p className="text-gray-300 font-body mb-6">
        {description}
      </p>
      
      {code && (
        <div 
          className="p-4 rounded-lg font-mono text-sm overflow-x-auto"
          style={{ 
            background: 'rgba(0, 0, 0, 0.4)',
            borderLeft: '3px solid var(--electric-accent)'
          }}
        >
          <code style={{ color: 'var(--electric-accent)' }}>{code}</code>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div 
                className="text-2xl font-display font-bold mb-1"
                style={{ color: 'var(--electric-accent)' }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 font-body">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MechanicCard({ 
  icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: string
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="glass-card p-6 rounded-xl hover:scale-105 transition-transform">
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{icon}</div>
        <div>
          <h3 className="text-xl font-display font-bold text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-300 font-body leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function GenerationCard({ 
  gen, 
  region, 
  count, 
  color 
}: { 
  gen: string
  region: string
  count: string
  color: string
}) {
  return (
    <div className="glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-300 text-center">
      <div 
        className="text-6xl font-display font-black mb-4"
        style={{ color }}
      >
        {count}
      </div>
      <h3 className="text-2xl font-display font-bold text-white mb-2">
        {gen}
      </h3>
      <p className="text-gray-400 font-body">
        {region} Region
      </p>
    </div>
  )
}
