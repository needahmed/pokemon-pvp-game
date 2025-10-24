'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="group relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-fire-primary to-electric-primary opacity-0 group-hover:opacity-50 blur-lg transition-opacity" />
            <span className="relative text-2xl font-display font-black text-white">
              POKEMON PVP
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/" label="Home" />
            <NavLink href="/about" label="About" />
            <NavLink href="/features" label="Features" />
            <NavLink href="/contact" label="Contact" />
            
            {/* CTA Button */}
            <Link 
              href="/play"
              className="relative px-6 py-3 font-display font-bold bg-gradient-to-r from-fire-primary to-fire-accent rounded-lg hover:scale-105 transition-transform overflow-hidden group"
            >
              <span className="relative z-10 text-white">START BATTLE</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-white/10">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <MobileNavLink href="/" label="Home" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavLink href="/about" label="About" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavLink href="/features" label="Features" onClick={() => setMobileMenuOpen(false)} />
            <MobileNavLink href="/contact" label="Contact" onClick={() => setMobileMenuOpen(false)} />
            <Link 
              href="/play"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full px-6 py-3 font-display font-bold bg-gradient-to-r from-fire-primary to-fire-accent rounded-lg text-center text-white"
            >
              START BATTLE
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link 
      href={href}
      className="text-gray-300 hover:text-white font-body font-medium transition-colors text-lg"
    >
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className="block text-gray-300 hover:text-white font-body font-medium transition-colors text-lg py-2"
    >
      {label}
    </Link>
  )
}
