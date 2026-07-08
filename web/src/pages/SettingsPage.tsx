import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function SettingsPage() {
  const [partnerSetup, setPartnerSetup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    partner_name: '',
    partner_whatsapp_number: ''
  });

  const [resetConfirm, setResetConfirm] = useState('');
  const [resettingVault, setResettingVault] = useState(false);

  const handleVaultReset = async () => {
    if (resetConfirm !== 'DELETE') return;
    setResettingVault(true);
    try {
      await api.delete('/vault/reset');
      setResetConfirm('');
      alert('Vault successfully reset.');
    } catch (e: any) {
      alert('Failed to reset vault: ' + e.message);
    } finally {
      setResettingVault(false);
    }
  };

  const fetchSetup = async () => {
    try {
      const data = await api.get('/partner/setup');
      if (data) {
        setPartnerSetup(data);
        setForm({
          partner_name: data.partner_name,
          partner_whatsapp_number: data.partner_whatsapp_number
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetup();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.post('/partner/setup', form);
      setPartnerSetup(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const shareLink = partnerSetup ? `${window.location.origin}/shared/${partnerSetup.token}` : '';

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-[var(--text-secondary)] text-sm">System configuration.</p>
      </div>

      <div className="space-y-8">
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Partner Sync (Magic Link)</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Partner Name</label>
                <input 
                  required
                  value={form.partner_name} onChange={e => setForm({...form, partner_name: e.target.value})}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  placeholder="e.g. Alice"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">WhatsApp Number</label>
                <input 
                  required
                  value={form.partner_whatsapp_number} onChange={e => setForm({...form, partner_whatsapp_number: e.target.value})}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  placeholder="e.g. 14155552671"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={saving}
              className="bg-[var(--text-primary)] text-[var(--bg-base)] font-medium px-4 py-2 rounded-md hover:bg-white transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? 'Generating...' : partnerSetup ? 'Regenerate Link' : 'Generate Link'}
            </button>
          </form>

          {partnerSetup && (
            <div className="mt-6 p-4 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg">
              <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] block mb-2">Public Share Link</label>
              <div className="flex items-center gap-2">
                <input 
                  readOnly 
                  value={shareLink}
                  className="flex-1 bg-transparent border-none text-sm font-mono text-[var(--text-primary)] outline-none"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                  className="text-xs bg-[var(--text-primary)] text-[var(--bg-base)] px-2 py-1 rounded"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-3">This link provides zero-login, read-only access to your task progress.</p>
            </div>
          )}
        </section>
        <section className="bg-[var(--bg-surface)] border border-red-900/30 rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4 text-red-500">Danger Zone</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Reset Vault PIN</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3">
                Forgotten PINs cannot be recovered. Resetting the vault will permanently destroy all existing encrypted entries. Type <span className="font-mono text-red-400">DELETE</span> to confirm.
              </p>
              <div className="flex gap-3">
                <input 
                  value={resetConfirm} onChange={e => setResetConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className="flex-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-red-500"
                />
                <button 
                  onClick={handleVaultReset}
                  disabled={resetConfirm !== 'DELETE' || resettingVault}
                  className="bg-red-500 text-white font-medium px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                >
                  {resettingVault ? 'Resetting...' : 'Factory Reset Vault'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
