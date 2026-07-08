import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Inbox, Plus, Trash2, Info } from 'lucide-react';

export default function CapturesPage() {
  const [captures, setCaptures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('');

  const fetchCaptures = async () => {
    try {
      const data = await api.get('/captures');
      setCaptures(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptures();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await api.post('/captures', { content, platform: platform || null });
    setContent('');
    setPlatform('');
    fetchCaptures();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/captures/${id}`);
    fetchCaptures();
  };

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-8">
        <Inbox className="w-5 h-5 text-[var(--accent)]" />
        <h1 className="text-2xl font-semibold">Captures</h1>
        <div className="relative group cursor-help ml-2 mt-1">
          <Info className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" />
          <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-xs text-[var(--text-secondary)] font-normal">
            A quick inbox for unstructured thoughts, ideas, or social media drafts. Shared with your partner.
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-4 mb-8">
        <h2 className="text-sm font-medium mb-4">Quick Capture</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <textarea 
            required placeholder="Idea or draft..."
            value={content} onChange={e => setContent(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)] min-h-[80px] resize-y"
          />
          <div className="flex gap-2">
            <input 
              placeholder="Tag (e.g. LinkedIn, Blog, Setup)"
              value={platform} onChange={e => setPlatform(e.target.value)}
              className="flex-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)]"
            />
            <button type="submit" className="bg-[var(--text-primary)] text-[var(--bg-base)] px-4 py-2 rounded text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Save
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {captures.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">No captures saved.</p>
        ) : (
          captures.map(c => (
            <div key={c.id} className="p-4 border border-[var(--border-hairline)] rounded-lg flex items-start justify-between gap-4 bg-[var(--bg-surface)]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {c.platform && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent)] text-white font-medium uppercase">
                      {c.platform}
                    </span>
                  )}
                  {c.creator?.username && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                      {c.creator.username}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-tertiary)] font-mono ml-auto">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{c.content}</p>
              </div>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors mt-4">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
