"use client"

import { useState } from 'react'
import { User, Mail, FileText, Send } from 'lucide-react'
import { WaterRipples } from '@/components/animations/WaterRipples'
import { Navigation } from '@/components/ui/shared/Navigation'
import { Footer } from '@/components/ui/shared/Footer'
import { Github, Twitter, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
    alert('Thank you for your message! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-950 to-bg-darker">
      <Navigation />
      
      {/* Hero Section - Water Theme */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        {/* Water Effects */}
        <div className="absolute inset-0">
          <WaterRipples />
          <div className="absolute inset-0 bg-gradient-water animate-gradient-shift opacity-10" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-32">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-6">
                GET IN{' '}
                <span style={{ color: 'var(--water-accent)' }}>TOUCH</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 font-body">
                Questions? Feedback? Collaboration? We&apos;d love to hear from you!
              </p>
            </div>

            {/* Contact Form with Liquid Morphism */}
            <div className="relative group">
              {/* Glassmorphic Background */}
              <div 
                className="absolute -inset-4 blur-2xl opacity-20 group-hover:opacity-30 transition-opacity rounded-3xl"
                style={{ background: 'linear-gradient(to bottom right, var(--water-primary), var(--water-accent))' }}
              />
              
              <form 
                onSubmit={handleSubmit}
                className="relative glass-card p-8 md:p-12 rounded-3xl border-2"
                style={{ borderColor: 'rgba(135, 206, 235, 0.3)' }}
              >
                {/* Name Field */}
                <div className="mb-6">
                  <label htmlFor="name" className="block text-sm font-display font-bold text-white mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    TRAINER NAME
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-body focus:outline-none focus:border-water-accent transition-colors"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email Field */}
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-display font-bold text-white mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-body focus:outline-none focus:border-water-accent transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Subject Field */}
                <div className="mb-6">
                  <label htmlFor="subject" className="block text-sm font-display font-bold text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    SUBJECT
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-body focus:outline-none focus:border-water-accent transition-colors"
                    placeholder="What's this about?"
                  />
                </div>

                {/* Message Field */}
                <div className="mb-8">
                  <label htmlFor="message" className="block text-sm font-display font-bold text-white mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    YOUR MESSAGE
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-body focus:outline-none focus:border-water-accent transition-colors resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  className="w-full relative group/button overflow-hidden py-4 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  <div 
                    className="absolute inset-0"
                    style={{ background: 'var(--water-gradient)' }}
                  />
                  <div 
                    className="absolute inset-0 opacity-0 group-hover/button:opacity-100 transition-opacity"
                    style={{ background: 'var(--water-accent)' }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2 text-xl font-display font-bold text-white">
                    SEND MESSAGE
                    <Send className="w-5 h-5" />
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Contact Methods */}
      <section className="py-32 bg-bg-dark">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display font-black text-center mb-20 text-white">
            OTHER WAYS TO{' '}
            <span style={{ color: 'var(--water-accent)' }}>CONNECT</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <ContactMethodCard
              icon={<MessageCircle size={40} />}
              title="Discord Community"
              description="Join our Discord server for real-time chat with other trainers"
              action="Join Server"
              color="water"
            />
            <ContactMethodCard
              icon={<Github size={40} />}
              title="GitHub"
              description="Contribute to the project or report issues on our repository"
              action="View Repo"
              color="electric"
            />
            <ContactMethodCard
              icon={<Twitter size={40} />}
              title="Twitter"
              description="Follow us for updates, announcements, and Pokemon content"
              action="Follow Us"
              color="fire"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-gradient-to-b from-bg-dark to-bg-darker">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-display font-black text-center mb-20 text-white">
            FREQUENTLY ASKED{' '}
            <span style={{ color: 'var(--water-accent)' }}>QUESTIONS</span>
          </h2>

          <div className="max-w-4xl mx-auto space-y-6">
            <FAQItem
              question="Is this game free to play?"
              answer="Yes! Pokemon PVP is completely free and open-source. We built this as a passion project for the Pokemon community."
            />
            <FAQItem
              question="Which Pokemon are available?"
              answer="All 386 Pokemon from Generations 1-3 (Kanto, Johto, and Hoenn regions) are available to battle with."
            />
            <FAQItem
              question="Can I play on mobile?"
              answer="Yes! The game is fully responsive and works on all devices including desktop, tablet, and mobile."
            />
            <FAQItem
              question="Are there tournaments or rankings?"
              answer="Not yet, but we're actively working on adding competitive features like tournaments, leaderboards, and ELO rankings!"
            />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function ContactMethodCard({ 
  icon, 
  title, 
  description, 
  action, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  action: string
  color: string
}) {
  return (
    <div className="glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-300 text-center">
      <div className="flex justify-center mb-4 text-water-accent">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold text-white mb-3">
        {title}
      </h3>
      <p className="text-gray-300 font-body mb-6">
        {description}
      </p>
      <button 
        className="px-6 py-2 rounded-lg font-display font-bold text-white transition-all hover:scale-105"
        style={{ background: `var(--${color}-gradient)` }}
      >
        {action}
      </button>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="glass-card p-6 rounded-xl cursor-pointer hover:scale-105 transition-transform"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display font-bold text-white pr-4">
          {question}
        </h3>
        <span 
          className="text-2xl transform transition-transform"
          style={{ 
            color: 'var(--water-accent)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
          }}
        >
          ▼
        </span>
      </div>
      {isOpen && (
        <p className="text-gray-300 font-body mt-4 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  )
}
