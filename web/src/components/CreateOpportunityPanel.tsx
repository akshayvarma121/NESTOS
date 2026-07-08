import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function CreateOpportunityPanel({ isOpen, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: '',
    role: '',
    source_link: '',
    notes: '',
    deadline: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // If deadline is empty string, send null
    const payload = {
      ...form,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };
    await onSubmit(payload);
    setLoading(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-[var(--bg-surface-raised)] border-l border-[var(--border-hairline)] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border-hairline)]">
          <h2 className="text-lg font-semibold">New Opportunity</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--border-hairline)] rounded-md text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Company</label>
            <input 
              required autoFocus
              value={form.company} onChange={e => setForm({...form, company: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              placeholder="e.g. Google"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Role</label>
            <input 
              required
              value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              placeholder="e.g. L3 Software Engineer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Source Link</label>
            <input 
              type="url"
              value={form.source_link} onChange={e => setForm({...form, source_link: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              placeholder="https://careers.google.com/..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Deadline (Optional)</label>
            <input 
              type="datetime-local"
              value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Notes</label>
            <textarea 
              rows={3}
              value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none"
              placeholder="Referral via Alice..."
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] font-medium py-2 rounded-md hover:bg-white transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </>
  );
}
