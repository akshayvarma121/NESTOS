import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function PartnerPage() {
  const [nudges, setNudges] = useState<any[]>([]);
  const [partnerSetup, setPartnerSetup] = useState<any>(null);
  const [customMsg, setCustomMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInitial = async () => {
    try {
      const setup = await api.get('/partner/setup');
      setPartnerSetup(setup);
      const history = await api.get('/nudges');
      setNudges(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  const handleNudge = async (msg: string) => {
    if (!partnerSetup?.partner_whatsapp_number) return;
    
    try {
      // 1. Log the nudge to backend
      const logged = await api.post('/nudges', { message: msg });
      setNudges(prev => [logged, ...prev]);
      setCustomMsg('');

      // 2. Trigger the wa.me deep link
      // Clean number (remove +, spaces, dashes)
      const cleanNumber = partnerSetup.partner_whatsapp_number.replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(msg);
      window.open(`https://wa.me/${cleanNumber}?text=${encodedMsg}`, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  if (!partnerSetup) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-medium mb-2">No Partner Configured</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-4">Go to Settings to set up your partner sync.</p>
        <a href="/settings" className="text-[var(--bg-base)] bg-[var(--text-primary)] px-4 py-2 rounded-md text-sm font-medium">Open Settings</a>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Partner Sync</h1>
        <p className="text-[var(--text-secondary)] text-sm">Send WhatsApp nudges to {partnerSetup.partner_name}.</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-4 md:p-6 mb-8 flex-shrink-0 space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Quick Nudges</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => handleNudge('Get back to work!')}
            className="flex-1 py-3 px-4 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-left sm:text-center"
          >
            "Get back to work!"
          </button>
          <button 
            onClick={() => handleNudge('Did you do your LeetCode today?')}
            className="flex-1 py-3 px-4 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-left sm:text-center"
          >
            "Did you do LeetCode?"
          </button>
        </div>

        <div className="pt-4 border-t border-[var(--border-hairline)] flex gap-3">
          <input 
            value={customMsg} onChange={e => setCustomMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && customMsg.trim() && handleNudge(customMsg)}
            placeholder="Custom message..."
            className="flex-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <button 
            onClick={() => customMsg.trim() && handleNudge(customMsg)}
            disabled={!customMsg.trim()}
            className="bg-[var(--text-primary)] text-[var(--bg-base)] font-medium px-4 py-2 rounded-md hover:bg-white transition-colors disabled:opacity-50 text-sm"
          >
            Send
          </button>
        </div>
      </div>

      <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Nudge History</h2>
      <div className="flex-1 overflow-y-auto space-y-2 pb-24">
        {nudges.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No nudges sent yet.</p>
        ) : (
          nudges.map(n => (
            <div key={n.id} className="p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg flex items-center justify-between gap-4">
              <p className="text-sm text-[var(--text-primary)] truncate">{n.message}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{new Date(n.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <div className="w-2 h-2 rounded-full bg-[#10b981]" title="Sent" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
