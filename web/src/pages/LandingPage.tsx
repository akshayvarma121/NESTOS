import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, Shield, Zap, Target, ArrowRight } from 'lucide-react';
import React from 'react';

export default function LandingPage() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans relative selection:bg-[var(--accent)] selection:text-white">
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(to right, var(--border-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--border-hairline) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto border-b-2 border-[var(--border-hairline)] mb-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--accent)] brutal-border brutal-shadow-sm flex items-center justify-center font-mono font-bold text-white">N</div>
          <span className="font-mono font-bold text-xl tracking-tighter">NESTOS</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#features" className="hidden md:block font-mono text-sm hover:text-[var(--accent)] transition-colors">/features</a>
          <a href="#philosophy" className="hidden md:block font-mono text-sm hover:text-[var(--accent)] transition-colors">/philosophy</a>
          {session ? (
            <Link to="/focus" className="brutal-btn bg-[var(--accent)] text-white px-4 py-2 font-mono text-sm font-bold flex items-center gap-2">
              COMMAND CENTER <ArrowRight size={16} />
            </Link>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="font-mono text-sm px-4 py-2 hover:bg-[var(--bg-surface)] brutal-border transition-colors">
                LOGIN
              </Link>
              <Link to="/register" className="brutal-btn bg-[var(--accent)] text-white px-4 py-2 font-mono text-sm font-bold">
                INIT_USER
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <section className="py-24 md:py-32 flex flex-col items-center text-center">
          <div className="inline-block mb-6 px-3 py-1 bg-[var(--bg-surface-raised)] brutal-border text-sm font-mono text-[var(--accent)]">
            V 1.0.0 // ONLINE
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 uppercase">
            Zero Friction.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-[var(--accent)] to-[var(--danger)]">Extreme Focus.</span>
          </h1>
          <p className="max-w-2xl text-xl text-[var(--text-secondary)] font-mono mb-12 leading-relaxed">
            A high-performance, strictly designed brutalist operating system built for absolute focus. Drop the distractions. Execute the macro.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
            {session ? (
              <Link to="/focus" className="brutal-btn bg-[var(--text-primary)] text-[var(--bg-base)] px-8 py-4 font-mono font-bold text-lg flex items-center justify-center gap-2 hover:-translate-y-1 transition-transform">
                ENTER NESTOS <Zap size={20} />
              </Link>
            ) : (
              <Link to="/register" className="brutal-btn bg-[var(--accent)] text-white px-8 py-4 font-mono font-bold text-lg flex items-center justify-center gap-2 hover:-translate-y-1 transition-transform">
                START EXECUTION <Zap size={20} />
              </Link>
            )}
            <a href="#philosophy" className="brutal-btn bg-[var(--bg-surface)] px-8 py-4 font-mono font-bold text-lg flex items-center justify-center hover:-translate-y-1 transition-transform">
              READ MANIFESTO
            </a>
          </div>
        </section>

        {/* Features Showcase */}
        <section id="features" className="py-24 border-t-2 border-[var(--border-hairline)]">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">System Capabilities</h2>
            <p className="font-mono text-[var(--text-secondary)] text-lg">Strictly utilitarian. Everything you need. Nothing you don't.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Target size={32} />}
              title="Focus Dashboard"
              desc="Your daily horizon. Scheduled micro-tasks for the day. Disappears upon completion."
              color="var(--accent)"
            />
            <FeatureCard 
              icon={<Zap size={32} />}
              title="Goal Engine"
              desc="Break macro goals into micro-slices. Assign to partners, schedule, and tag effortlessly."
              color="var(--warning)"
            />
            <FeatureCard 
              icon={<Shield size={32} />}
              title="Encrypted Vault"
              desc="Zero-knowledge architecture. AES-256-GCM encryption for API keys and sensitive journals."
              color="var(--success)"
            />
            <FeatureCard 
              icon={<Terminal size={32} />}
              title="Brutalist Workflow"
              desc="No flashy graphics. High contrast, mono-spaced typography. Zero input friction."
              color="var(--danger)"
            />
            <FeatureCard 
              icon={<Target size={32} />}
              title="Partner Sync"
              desc="Real-time synchronization with accountability partners. Shared goals, separate vaults."
              color="var(--accent)"
            />
            <FeatureCard 
              icon={<Zap size={32} />}
              title="Global Pomodoro"
              desc="Persistent context timer that survives page navigation with gamified milestone tracking."
              color="var(--warning)"
            />
          </div>
        </section>

        {/* Philosophy / CTA */}
        <section id="philosophy" className="py-24 border-t-2 border-[var(--border-hairline)] mb-24">
          <div className="bg-[var(--text-primary)] text-[var(--bg-base)] p-8 md:p-16 brutal-shadow-lg brutal-border flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-black uppercase tracking-tight mb-6">The Backlog Awaits</h2>
              <p className="font-mono text-lg mb-6 opacity-90 leading-relaxed">
                Everything not scheduled for today is hidden away. Automated cron jobs sweep incomplete goals to the backlog. 
                Stop procrastinating. Start executing.
              </p>
            </div>
            <div>
              {session ? (
                 <Link to="/focus" className="brutal-btn bg-[var(--bg-base)] text-[var(--text-primary)] px-8 py-4 font-mono font-bold text-xl inline-block hover:-translate-y-1 transition-transform">
                  LAUNCH
                </Link>
              ) : (
                <Link to="/register" className="brutal-btn bg-[var(--danger)] text-white border-2 border-[var(--bg-base)] shadow-[4px_4px_0px_var(--bg-base)] px-8 py-4 font-mono font-bold text-xl inline-block hover:-translate-y-1 transition-transform">
                  INITIALIZE ACCOUNT
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[var(--border-hairline)] bg-[var(--bg-surface)] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-[var(--accent)] brutal-border flex items-center justify-center font-mono font-bold text-white text-xs">N</div>
             <span className="font-mono font-bold tracking-tighter">NESTOS // v1.0</span>
          </div>
          <div className="font-mono text-sm text-[var(--text-tertiary)] flex gap-8">
            <span>© {new Date().getFullYear()} NESTOS. All rights reserved.</span>
            <a href="https://github.com/akshayvarma121" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  return (
    <div className="bg-[var(--bg-surface)] p-8 brutal-border brutal-shadow transition-transform hover:-translate-y-1 group">
      <div className="mb-6 p-4 inline-block brutal-border bg-[var(--bg-base)]" style={{ color }}>
        {icon}
      </div>
      <h3 className="text-2xl font-black uppercase mb-3 group-hover:text-[var(--accent)] transition-colors">{title}</h3>
      <p className="font-mono text-[var(--text-secondary)] leading-relaxed">{desc}</p>
    </div>
  );
}
