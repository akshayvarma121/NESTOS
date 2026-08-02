import { useState } from "react";
import { guidanceRegistry, type GuidanceEntry } from "../lib/guidanceRegistry";
import { useHelp } from "../contexts/HelpContext";
import { Search, Mail, RefreshCw, Play } from "lucide-react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { startTour, resetAll } = useHelp();

  const allEntries = Object.values(guidanceRegistry);
  
  const filteredEntries = allEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.group]) acc[entry.group] = [];
    acc[entry.group].push(entry);
    return acc;
  }, {} as Record<string, GuidanceEntry[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      <header className="mb-12 border-b-4 border-black pb-6">
        <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-widest mb-4">
          System Guidance
        </h1>
        <p className="text-lg font-bold opacity-80 max-w-2xl">
          Complete documentation for NestOS mechanics. Everything you need to know about how the system operates.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls & Contact */}
        <div className="space-y-8 lg:col-span-1">
          {/* Search */}
          <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] p-4">
            <div className="flex items-center gap-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] p-2">
              <Search className="w-5 h-5 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full font-bold placeholder-[var(--text-tertiary)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 space-y-4">
            <h3 className="font-black font-mono uppercase tracking-widest text-sm mb-4 text-[var(--text-primary)]">
              Reset State
            </h3>
            
            <div>
              <button
                onClick={startTour}
                className="w-full flex items-center justify-center gap-3 bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-hairline)] p-3 font-bold uppercase tracking-wider hover:bg-[var(--bg-base)] transition-colors mb-2"
              >
                <Play className="w-5 h-5" /> Restart Intro Tour
              </button>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold">
                Replays the main sequential app walkthrough. Use this to review the overall system flow.
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--border-hairline)]">
              <button
                onClick={resetAll}
                className="w-full flex items-center justify-center gap-3 bg-[var(--danger)] text-white border border-[var(--danger)] p-3 font-bold uppercase tracking-wider hover:opacity-90 transition-opacity mb-2 mt-4"
              >
                <RefreshCw className="w-5 h-5" /> Reset All Tooltips
              </button>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold">
                Restores dismissed inline hints (like the JSON upload hint). These are contextual popups, separate from the main tour.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] p-6">
            <h3 className="font-black font-mono uppercase tracking-widest text-sm mb-4 text-[var(--text-primary)]">
              Support
            </h3>
            <p className="text-sm font-bold mb-4 text-[var(--text-secondary)]">
              Need help or want to provide feedback? Reach out directly to the creator.
            </p>
            <a
              href="mailto:support@nestos.com"
              className="inline-flex items-center gap-2 text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-4 py-2 font-bold hover:bg-[var(--text-primary)] hover:text-[var(--bg-base)] transition-colors"
            >
              <Mail className="w-4 h-4" /> support@nestos.com
            </a>
          </div>
        </div>

        {/* Right Column: Directory */}
        <div className="lg:col-span-2 space-y-10">
          {Object.keys(groupedEntries).length === 0 ? (
            <div className="p-8 border border-dashed border-[var(--border-hairline)] text-center font-bold text-[var(--text-secondary)]">
              No guidance found matching your search.
            </div>
          ) : (
            Object.entries(groupedEntries).map(([group, entries]) => (
              <section key={group}>
                <h2 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-4 text-[var(--text-primary)]">
                  {group}
                  <div className="h-1 bg-[var(--border-hairline)] flex-1 opacity-50"></div>
                </h2>
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 hover:-translate-y-1 transition-transform"
                    >
                      <h3 className="text-lg font-black uppercase tracking-wider mb-2 text-[var(--text-primary)]">
                        {entry.title}
                      </h3>
                      <p className="font-bold leading-relaxed text-[var(--text-secondary)]">
                        {entry.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
