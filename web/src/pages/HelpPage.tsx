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
          <div className="bg-[#a8e6cf] border-4 border-black p-4 brutal-shadow-sm">
            <div className="flex items-center gap-3 bg-white border-2 border-black p-2">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full font-bold placeholder-gray-500"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border-4 border-black p-6 brutal-shadow-sm space-y-4">
            <h3 className="font-black font-mono uppercase tracking-widest text-sm mb-4">
              Reset State
            </h3>
            <button
              onClick={startTour}
              className="w-full flex items-center gap-3 bg-[#ffeb3b] text-black border-2 border-black p-3 font-bold uppercase tracking-wider hover:-translate-y-1 hover:-translate-x-1 hover:brutal-shadow-sm transition-all"
            >
              <Play className="w-5 h-5" /> Restart Intro Tour
            </button>
            <button
              onClick={resetAll}
              className="w-full flex items-center gap-3 bg-[#ff6b6b] text-white border-2 border-black p-3 font-bold uppercase tracking-wider hover:-translate-y-1 hover:-translate-x-1 hover:brutal-shadow-sm transition-all"
            >
              <RefreshCw className="w-5 h-5" /> Reset All Tooltips
            </button>
          </div>

          {/* Contact */}
          <div className="bg-[var(--bg-surface-raised)] border-4 border-black p-6 brutal-shadow-sm">
            <h3 className="font-black font-mono uppercase tracking-widest text-sm mb-4">
              Support
            </h3>
            <p className="text-sm font-bold mb-4">
              Need help or want to provide feedback? Reach out directly to the creator.
            </p>
            <a
              href="mailto:support@nestos.com"
              className="inline-flex items-center gap-2 text-black bg-white border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" /> support@nestos.com
            </a>
          </div>
        </div>

        {/* Right Column: Directory */}
        <div className="lg:col-span-2 space-y-10">
          {Object.keys(groupedEntries).length === 0 ? (
            <div className="p-8 border-4 border-dashed border-black text-center font-bold text-gray-500">
              No guidance found matching your search.
            </div>
          ) : (
            Object.entries(groupedEntries).map(([group, entries]) => (
              <section key={group}>
                <h2 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-4">
                  {group}
                  <div className="h-1 bg-black flex-1 opacity-20"></div>
                </h2>
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white border-4 border-black p-6 brutal-shadow-sm hover:-translate-y-1 transition-transform"
                    >
                      <h3 className="text-lg font-black uppercase tracking-wider mb-2">
                        {entry.title}
                      </h3>
                      <p className="font-bold leading-relaxed opacity-80">
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
