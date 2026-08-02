import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Scroll-reveal hook ─────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─── Marquee strip ──────────────────────────────────────────────── */
const STRIP_ITEMS = [
  'FOCUS DASHBOARD', '→', 'BACKLOG', '→', 'DAILY ROUTINES', '→',
  'PARTNER SYNC', '→', 'ENCRYPTED VAULT', '→', 'ANALYTICS', '→',
  'FOCUS DASHBOARD', '→', 'BACKLOG', '→', 'DAILY ROUTINES', '→',
  'PARTNER SYNC', '→', 'ENCRYPTED VAULT', '→', 'ANALYTICS', '→',
];

function Marquee() {
  return (
    <div className="overflow-hidden border-y border-[#2a2a2a] py-3 my-0">
      <div
        style={{ display: 'flex', gap: '2.5rem', animation: 'marquee 22s linear infinite', whiteSpace: 'nowrap' }}
      >
        {STRIP_ITEMS.map((t, i) => (
          <span key={i} className={`text-xs font-bold tracking-widest uppercase ${t === '→' ? 'text-[#ff3b30]' : 'text-[#5c5c60]'}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Live task demo ─────────────────────────────────────────────── */
const TODAY_TASKS = ['Write research notes', 'Review PR #14', 'Call dentist'];
const BACKLOG_TASKS = ['Learn Rust', 'Plan Q3 goals', 'Update portfolio', 'Read Atomic Habits', 'Clear email inbox'];

function TaskDemo() {
  const [crossed, setCrossed] = useState<number[]>([]);
  const toggle = useCallback((i: number) => {
    setCrossed(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i]);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-0 border border-[#2a2a2a] mt-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Today */}
      <div className="border-r border-[#2a2a2a]">
        <div className="border-b border-[#2a2a2a] px-4 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] animate-pulse inline-block" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#ff3b30]">Today</span>
        </div>
        <div className="flex flex-col">
          {TODAY_TASKS.map((t, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="text-left px-4 py-3 border-b border-[#1a1a1a] text-xs text-[#eaeaea] flex items-center gap-3 hover:bg-[#111] transition-colors group"
            >
              <span className={`w-3 h-3 border border-[#4b4b4b] flex-shrink-0 flex items-center justify-center text-[8px] transition-colors ${crossed.includes(i) ? 'bg-[#ff3b30] border-[#ff3b30]' : 'group-hover:border-[#eaeaea]'}`}>
                {crossed.includes(i) && '✓'}
              </span>
              <span className={`transition-all ${crossed.includes(i) ? 'line-through text-[#5c5c60]' : ''}`}>{t}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Backlog */}
      <div>
        <div className="border-b border-[#2a2a2a] px-4 py-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#5c5c60]">Backlog — hidden</span>
        </div>
        <div className="flex flex-col">
          {BACKLOG_TASKS.map((t, i) => (
            <div key={i} className="px-4 py-3 border-b border-[#1a1a1a] text-xs text-[#2e2e2e] flex items-center gap-3 select-none">
              <span className="w-3 h-3 border border-[#1e1e1e] flex-shrink-0" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Feature section ────────────────────────────────────────────── */
interface FeatureProps {
  num: string;
  tag: string;
  title: string;
  desc: string;
  detail: string;
  flip?: boolean;
}

function Feature({ num, tag, title, desc, detail, flip }: FeatureProps) {
  const { ref, visible } = useReveal(0.1);

  return (
    <div
      ref={ref}
      className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-0 border-b border-[#1a1a1a] py-20 transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(48px)',
      }}
    >
      {/* Oversized number */}
      <div className={`relative flex ${flip ? 'lg:order-2 justify-end' : ''}`}>
        <div
          className="select-none font-black font-sans leading-none text-[#111] pointer-events-none"
          style={{ fontSize: 'clamp(8rem, 18vw, 16rem)', letterSpacing: '-0.05em', lineHeight: 1 }}
          aria-hidden
        >
          {num}
        </div>
        <div className={`absolute bottom-4 ${flip ? 'left-0' : 'right-0 lg:right-auto lg:left-0'} flex flex-col gap-1`}>
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#ff3b30] font-bold">{tag}</span>
        </div>
      </div>

      {/* Text */}
      <div className={`flex flex-col justify-center gap-5 px-0 lg:px-12 ${flip ? 'lg:order-1' : ''}`}>
        <h3 className="text-3xl sm:text-4xl font-black font-sans uppercase tracking-tight text-[#eaeaea] leading-none">{title}</h3>
        <p className="text-sm text-[#ff3b30] font-bold leading-snug">{desc}</p>
        <p className="text-sm text-[#7a7a7e] leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

/* ─── Countdown block ────────────────────────────────────────────── */
function CountdownBlock() {
  const [t, setT] = useState('');
  const { ref, visible } = useReveal(0.1);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(23, 0, 0, 0);
      if (now > target) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setT(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={ref}
      className="relative border-y-2 border-[#1a1a1a] py-24 flex flex-col items-center gap-6 overflow-hidden transition-all duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <span className="text-[10px] tracking-[0.4em] uppercase text-[#5c5c60] font-bold">Today locks at 23:00</span>
      <div
        className="font-black font-sans text-[#eaeaea] tabular-nums"
        style={{ fontSize: 'clamp(4rem, 15vw, 11rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
      >
        {t}
      </div>
      <p className="text-xs text-[#5c5c60] max-w-xs text-center leading-relaxed tracking-wide">
        At 11 PM every night the system locks. You cannot edit your past performance retroactively. What you did is what you did.
      </p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function LandingPage() {
  const [timeStr, setTimeStr] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Hero animates immediately on mount
    const id = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  const features: FeatureProps[] = [
    {
      num: '01',
      tag: 'Core Mechanic',
      title: 'Backlog & Daily Focus',
      desc: 'Everything you need to do lives in the Backlog. Only what you choose to do today appears on screen.',
      detail: 'Dump every task and idea into the Backlog — it stays hidden. Each morning, you pull tasks into your Daily Focus. While you work, that\'s the only screen you see. Complete a task and it vanishes. The rest of the world doesn\'t exist until tomorrow.',
    },
    {
      num: '02',
      tag: 'Daily Habits',
      title: 'Routines & The Lock',
      desc: 'Define habits. Mark them honest — done, skipped, or failed. At 11 PM the day closes permanently.',
      detail: 'Set up recurring things you need to do every day, like "Exercise" or "Read for 30 minutes". You mark each one as you go. At 11:00 PM the system locks the day. You cannot go back in and make yourself look better. This makes you honest.',
      flip: true,
    },
    {
      num: '03',
      tag: 'Multiplayer',
      title: 'Partner Sync',
      desc: 'Link one account. They see your goals and whether you actually finished. You see theirs.',
      detail: 'Connect with one accountability partner — a friend, coworker, or study buddy. You\'ll both see each other\'s shared goals and task completion. Not just a list — actual real-time proof of whether either of you is following through.',
    },
    {
      num: '04',
      tag: 'Privacy',
      title: 'Encrypted Vault',
      desc: 'A locked space for passwords, journal entries, and API keys. Even we cannot read it.',
      detail: 'Anything typed in the Vault is encrypted on your device before it ever reaches the server. The developers cannot read it. Unlocked by a 6-digit PIN only you know. Locks itself after inactivity. Your private notes stay private.',
      flip: true,
    },
    {
      num: '05',
      tag: 'Automated Tracking',
      title: 'Performance Analytics',
      desc: 'The app automatically calculates your real output — you never log anything manually.',
      detail: 'At midnight each day, the system calculates how many routines you completed, how many tasks you rolled over from previous days, and gives you an adherence score. No self-reporting. Just the number.',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor::after {
          content: '_';
          animation: cursor-blink 1s step-end infinite;
        }
        .line-draw {
          width: 0;
          transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .line-draw.active {
          width: 100%;
        }
      `}</style>

      <div className="min-h-screen bg-[#050505] text-[#eaeaea] selection:bg-[#ff3b30] selection:text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>

        {/* ── NAV ───────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] bg-[#050505]/95 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#eaeaea]">NESTOS</span>
            <span className="hidden sm:block w-px h-3 bg-[#2a2a2a]" />
            <span className="hidden sm:block text-[10px] text-[#5c5c60] tracking-widest">{timeStr}</span>
          </div>
          <a
            href="https://nestos-kappa.vercel.app"
            className="text-[10px] tracking-widest uppercase font-bold border border-[#eaeaea] px-5 py-2 hover:bg-[#eaeaea] hover:text-[#050505] transition-colors"
          >
            Open App
          </a>
        </nav>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className="px-6 sm:px-12 pt-20 pb-0 max-w-6xl mx-auto">
          <div
            ref={heroRef}
            className="transition-all duration-1000"
            style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(40px)' }}
          >
            {/* Big statement */}
            <h1
              className="font-black font-sans uppercase leading-none text-[#eaeaea]"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)', letterSpacing: '-0.04em', lineHeight: 0.9 }}
            >
              Stop looking<br />
              at tasks that<br />
              <span className="text-[#ff3b30]">aren't today.</span>
            </h1>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-24 items-start">
              <div className="flex flex-col gap-6">
                <p className="text-base sm:text-lg font-bold text-[#eaeaea] leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>
                  NestOS is a productivity app with one core idea:<br />
                  if a task isn't scheduled for today, you don't see it.
                </p>
                <p className="text-sm text-[#7a7a7e] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Everything else stays in a backlog, out of sight, until you decide to pull it in. No noise. No endless scroll. Just today.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <a
                    href="https://nestos-kappa.vercel.app"
                    className="bg-[#ff3b30] text-white px-6 py-3.5 text-xs tracking-widest uppercase font-bold hover:bg-white hover:text-[#050505] transition-colors"
                  >
                    Start for free
                  </a>
                  <a
                    href="https://github.com/akshayvarma121/NESTOS"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] tracking-widest uppercase text-[#5c5c60] hover:text-[#eaeaea] transition-colors"
                  >
                    GitHub →
                  </a>
                </div>
              </div>

              {/* Live interactive demo */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#5c5c60] font-bold">Try it — click a task to complete it</p>
                <TaskDemo />
                <p className="text-[10px] text-[#3a3a3a] mt-1">Everything in the right column is invisible to you while you work.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ───────────────────────────────────────────── */}
        <div className="mt-24">
          <Marquee />
        </div>

        {/* ── FEATURES ──────────────────────────────────────────── */}
        <section className="px-6 sm:px-12 max-w-6xl mx-auto mt-4">
          {features.map((f) => (
            <Feature key={f.num} {...f} />
          ))}
        </section>

        {/* ── COUNTDOWN INTERSTITIAL ────────────────────────────── */}
        <div className="px-6 sm:px-12 max-w-6xl mx-auto mt-8">
          <CountdownBlock />
        </div>

        {/* ── MARQUEE (REVERSE) ─────────────────────────────────── */}
        <div className="mt-0" style={{ transform: 'scaleX(-1)' }}>
          <Marquee />
        </div>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer className="px-6 sm:px-12 max-w-6xl mx-auto mt-24 pb-12">
          <FooterBlock />
        </footer>

      </div>
    </>
  );
}

/* ─── Footer with line animation ─────────────────────────────────── */
function FooterBlock() {
  const { ref, visible } = useReveal(0.1);

  return (
    <div ref={ref}>
      {/* Animated separator */}
      <div className="h-px bg-[#2a2a2a] mb-16 overflow-hidden">
        <div
          className="h-full bg-[#eaeaea] line-draw"
          style={{ width: visible ? '100%' : '0%', transition: 'width 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </div>

      <div
        className="transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)', transitionDelay: '300ms' }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
          {/* Left */}
          <div className="flex flex-col gap-5">
            <p
              className="font-black font-sans uppercase text-[#eaeaea] leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '-0.04em' }}
            >
              Ready to<br />
              <span className="text-[#ff3b30]">focus?</span>
            </p>
            <a
              href="https://nestos-kappa.vercel.app"
              className="self-start bg-[#eaeaea] text-[#050505] px-6 py-3.5 text-xs tracking-widest uppercase font-bold hover:bg-[#ff3b30] hover:text-white transition-colors"
            >
              Access NestOS
            </a>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-8 text-[10px] tracking-widest uppercase text-[#5c5c60] font-bold">
            <div className="flex flex-col gap-2">
              <span className="text-[#3a3a3a]">Project</span>
              <a href="https://github.com/akshayvarma121/NESTOS" target="_blank" rel="noreferrer" className="hover:text-[#eaeaea] transition-colors">GitHub Repository →</a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#3a3a3a]">Builder</span>
              <a href="https://github.com/akshayvarma121" target="_blank" rel="noreferrer" className="hover:text-[#eaeaea] transition-colors">akshayvarma121 →</a>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <span>NestOS v1.0.0</span>
              <span className="text-[#2a2a2a]">Built for focus. Not for vibes.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
