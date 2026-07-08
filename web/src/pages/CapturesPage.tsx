import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function CapturesPage() {
  const [captures, setCaptures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCaptures = async () => {
    try {
      const data = await api.get('/captures');
      setCaptures(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptures();
  }, []);

  const togglePosted = async (id: string, currentVal: boolean) => {
    setCaptures(prev => prev.map(c => c.id === id ? { ...c, posted: !currentVal } : c));
    try {
      await api.patch(`/captures/${id}`, { posted: !currentVal });
    } catch (e) {
      console.error("Failed to toggle posted", e);
      fetchCaptures(); // Revert
    }
  };

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="p-6 md:p-8 h-[calc(100vh-80px)] flex flex-col max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Content Captures</h1>
        <p className="text-[var(--text-secondary)] text-sm">Quick thoughts and milestone wins.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-24">
        {captures.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-secondary)] mt-10">No captures yet. Use the FAB to add one.</p>
        ) : (
          captures.map(capture => {
            let borderColor = 'border-[var(--border-hairline)]';
            if (capture.tag === 'dsa_win') borderColor = 'border-l-[var(--accent)]';
            else if (capture.tag === 'dev_milestone') borderColor = 'border-l-[#10b981]';
            else if (capture.tag === 'random') borderColor = 'border-l-[#8b5cf6]';

            return (
              <div 
                key={capture.id} 
                className={`p-4 bg-[var(--bg-surface)] border-y border-r border-l-4 rounded-lg flex items-start justify-between gap-4 transition-colors hover:border-r-[var(--text-secondary)] ${borderColor} ${capture.posted ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] line-clamp-2 whitespace-pre-wrap">{capture.raw_text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] tracking-wider">
                      {new Date(capture.created_at).toLocaleDateString()}
                    </span>
                    {capture.linked_macro_id && capture.pos_macro_goals?.title && (
                      <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] tracking-wider bg-[var(--bg-surface-raised)] px-1.5 py-0.5 rounded">
                        via {capture.pos_macro_goals.title}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-1">
                  <button 
                    onClick={() => togglePosted(capture.id, capture.posted)}
                    className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] focus-visible:ring-[var(--accent)] rounded"
                  >
                    <span className="text-xs text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">Posted</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${capture.posted ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-hairline)] bg-[var(--bg-base)]'}`}>
                      {capture.posted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
