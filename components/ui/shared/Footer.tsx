'use client'
import Link from 'next/link'
import { Github, Twitter, MessageCircle } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative bg-bg-darker border-t border-white/10 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 blur-[120px] opacity-20" style={{ background: 'var(--fire-glow)' }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 blur-[120px] opacity-20" style={{ background: 'var(--electric-glow)' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <h3 className="text-2xl font-display font-black text-white mb-4">POKEMON PVP</h3>
            <p className="text-gray-400 max-w-md mb-6">
              The ultimate online Pokemon battle experience. Free, open-source, and built with ❤️ for the Pokemon community.
            </p>
            <div className="flex gap-4">
              <SocialButton icon={<Github size={20} />} href="https://github.com" label="GitHub" />
              <SocialButton icon={<MessageCircle size={20} />} href="https://discord.com" label="Discord" />
              <SocialButton icon={<Twitter size={20} />} href="https://twitter.com" label="Twitter" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-white text-lg mb-4">QUICK LINKS</h3>
            <ul className="space-y-2">
              <FooterLink href="/play" label="Play Now" />
              <FooterLink href="/about" label="About" />
              <FooterLink href="/battle" label="Battle" />
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-display font-bold text-white text-lg mb-4">RESOURCES</h3>
            <ul className="space-y-2">
              <FooterLink href="https://pokeapi.co" label="PokeAPI" external />
              <FooterLink href="https://github.com" label="GitHub" external />
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Pokemon PVP. Pokémon © Nintendo/Creatures Inc./GAME FREAK inc.
          </p>
          <p className="text-gray-500 text-sm">
            Fan-made project • Not affiliated with Nintendo
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialButton({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 flex items-center justify-center rounded-lg glass-button hover:bg-white/20 transition-colors"
      aria-label={label}
    >
      {icon}
    </a>
  )
}

function FooterLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  if (external) {
    return (
      <li>
        <a 
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          {label}
        </a>
      </li>
    )
  }

  return (
    <li>
      <Link href={href} className="text-gray-400 hover:text-white transition-colors">
        {label}
      </Link>
    </li>
  )
}
