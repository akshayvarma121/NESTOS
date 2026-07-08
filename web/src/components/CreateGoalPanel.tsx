import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function CreateGoalPanel({ isOpen, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'dev',
    total_units: 10,
    unit_label: 'chapters',
    deadline: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] // +30 days default
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-[var(--bg-surface-raised)] border-l border-[var(--border-hairline)] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border-hairline)]">
          <h2 className="text-lg font-semibold">New Macro Goal</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--border-hairline)] rounded-md text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Goal Title</label>
            <input 
              required
              autoFocus
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              placeholder="e.g. Operating Systems Syllabus"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
            <select
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="academic">Academic</option>
              <option value="dsa">DSA</option>
              <option value="dev">Dev</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Total Units</label>
              <input 
                required type="number" min="1" max="1000"
                value={form.total_units}
                onChange={e => setForm({...form, total_units: parseInt(e.target.value)})}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Unit Label</label>
              <input 
                required
                value={form.unit_label}
                onChange={e => setForm({...form, unit_label: e.target.value})}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                placeholder="e.g. problems"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Deadline</label>
            <input 
              required type="date"
              value={form.deadline}
              onChange={e => setForm({...form, deadline: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] font-medium py-2 rounded-md hover:bg-white transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Slicing Tasks...' : 'Create & Slice'}
          </button>
        </form>
      </div>
    </>
  );
}
