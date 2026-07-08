import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Lightbulb, Plus, Trash2, ExternalLink, Info } from 'lucide-react';

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const fetchDeadlines = async () => {
    try {
      const data = await api.get('/deadlines');
      setDeadlines(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    // Combine date and time into timestamp
    const deadlineString = time ? `${date}T${time}:00` : `${date}T23:59:59`;
    const deadlineDate = new Date(deadlineString).toISOString();

    await api.post('/deadlines', { title, url: url || null, deadline: deadlineDate });
    setTitle('');
    setUrl('');
    setDate('');
    setTime('');
    fetchDeadlines();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/deadlines/${id}`);
    fetchDeadlines();
  };

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-8">
        <Lightbulb className="w-5 h-5 text-[var(--accent)]" />
        <h1 className="text-2xl font-semibold">Important Deadlines</h1>
        <div className="relative group cursor-help ml-2 mt-1">
          <Info className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" />
          <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-xs text-[var(--text-secondary)] font-normal">
            Track important dates or links. Any deadline scheduled for the future will automatically appear on your Focus Dashboard with a live countdown timer.
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-4 mb-8">
        <h2 className="text-sm font-medium mb-4">Add Deadline</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input 
            required placeholder="Title (e.g. Register for conference)"
            value={title} onChange={e => setTitle(e.target.value)}
            className="md:col-span-2 w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)]"
          />
          <input 
            placeholder="URL (optional)" type="url"
            value={url} onChange={e => setUrl(e.target.value)}
            className="md:col-span-2 w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)]"
          />
          <input 
            required type="date"
            value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)]"
          />
          <input 
            type="time"
            value={time} onChange={e => setTime(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--accent)]"
          />
          <button type="submit" className="md:col-span-2 w-full bg-[var(--text-primary)] text-[var(--bg-base)] py-2 rounded text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2 mt-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {deadlines.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-8">No deadlines currently tracked.</p>
        ) : (
          deadlines.map(d => {
            const isPast = new Date(d.deadline) < new Date();
            return (
              <div key={d.id} className={`p-4 border border-[var(--border-hairline)] rounded-lg flex items-center justify-between gap-4 bg-[var(--bg-surface)] ${isPast ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{d.title}</h3>
                    {d.creator?.username && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                        {d.creator.username}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-mono ${isPast ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                    {new Date(d.deadline).toLocaleString()}
                  </p>
                </div>
                {d.url && (
                  <a href={d.url} target="_blank" rel="noreferrer" className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => handleDelete(d.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
