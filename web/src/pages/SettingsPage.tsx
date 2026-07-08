import { useState } from 'react';
import { api } from '../lib/api';

export default function SettingsPage() {
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

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-[var(--text-secondary)] text-sm">System configuration.</p>
      </div>

      <div className="space-y-8">
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Account</h2>
          <div className="space-y-4">
            <a href="/partner" className="flex items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg hover:border-[var(--text-primary)] transition-colors">
              <div>
                <h3 className="text-sm font-medium">Partner Network</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">View your invite code or link a partner.</p>
              </div>
              <span className="text-[var(--text-tertiary)]">→</span>
            </a>
          </div>
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
