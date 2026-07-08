import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { X, Lock, Unlock, Plus } from 'lucide-react';

export default function VaultPage() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [vaultToken, setVaultToken] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('dsa');
  const [newValue, setNewValue] = useState('');
  const [showValue, setShowValue] = useState(false);

  const inactivityTimer = useRef<number | null>(null);

  const checkStatus = async () => {
    try {
      const res = await api.get('/vault/status');
      setIsSetup(res.isSetup);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const data = await api.get('/vault/entries');
      setEntries(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (vaultToken) {
      fetchEntries();
    }
  }, [vaultToken]);

  // Auto-lock logic
  useEffect(() => {
    if (!vaultToken) return;

    const lockVault = () => setVaultToken(null);
    
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = window.setTimeout(lockVault, 2 * 60 * 1000); // 2 mins
    };

    const handleVisibility = () => {
      if (document.hidden) lockVault();
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    document.addEventListener('visibilitychange', handleVisibility);
    
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [vaultToken]);

  // Route change auto-lock is implicitly handled by state clearing on unmount,
  // since `vaultToken` is local state. If they navigate away and back, it resets.

  const handleSetup = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    try {
      await api.post('/vault/setup', { pin });
      setIsSetup(true);
      setPin('');
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUnlock = async () => {
    try {
      const res = await api.post('/vault/unlock', { pin });
      setVaultToken(res.token);
      setPin('');
      setError('');
    } catch (e: any) {
      setError(e.message);
      setPin('');
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Must use fetch directly or wrapper to pass custom header
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/vault/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vault-token': vaultToken || '' },
        body: JSON.stringify({ label: newLabel, category: newCategory, value: newValue })
      });
      if (!res.ok) throw new Error('Failed to add entry');
      
      setNewLabel('');
      setNewValue('');
      setIsAdding(false);
      fetchEntries();
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    }
  };

  const revealAndCopy = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/vault/entries/${id}/reveal`, {
        headers: { 'x-vault-token': vaultToken || '' }
      });
      if (!res.ok) throw new Error('Failed to reveal');
      const { value } = await res.json();
      
      await navigator.clipboard.writeText(value);
      
      // Dispatch toast
      window.dispatchEvent(new CustomEvent('vault_copy', { detail: 'Copied — clears in 30s' }));
      
      setTimeout(() => {
        navigator.clipboard.writeText('');
      }, 30000);
      
    } catch (e) {
      console.error(e);
      alert('Failed to reveal entry. Session may have expired.');
      setVaultToken(null);
    }
  };

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  // LOCK SCREEN
  if (!vaultToken) {
    return (
      <div className="h-[calc(100vh-80px)] lg:h-screen flex flex-col items-center justify-center bg-[var(--bg-base)]">
        <div className="w-full max-w-sm px-8">
          <div className="text-center mb-8">
            <Lock className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">{isSetup ? 'Unlock Vault' : 'Setup Vault'}</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {isSetup ? 'Enter your PIN' : 'Create a master PIN. This cannot be recovered if lost.'}
            </p>
          </div>
          
          <input 
            type="password"
            value={pin}
            readOnly
            className="w-full text-center text-4xl font-mono tracking-[0.5em] bg-transparent border-b-2 border-[var(--border-hairline)] mb-8 py-4 outline-none text-[var(--text-primary)]"
          />

          {error && <p className="text-red-500 text-sm text-center mb-6">{error}</p>}

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num}
                onClick={() => setPin(p => p + num)}
                className="h-16 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] text-xl font-mono active:scale-95 transition-transform"
              >
                {num}
              </button>
            ))}
            <div />
            <button 
              onClick={() => setPin(p => p + '0')}
              className="h-16 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-raised)] text-xl font-mono active:scale-95 transition-transform"
            >
              0
            </button>
            <button 
              onClick={() => setPin(p => p.slice(0, -1))}
              className="h-16 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <button 
            onClick={isSetup ? handleUnlock : handleSetup}
            className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-base)] rounded-xl font-medium hover:bg-white active:scale-[0.98] transition-transform"
          >
            {isSetup ? 'Unlock' : 'Set PIN'}
          </button>
        </div>
      </div>
    );
  }

  // UNLOCKED VAULT
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto h-[calc(100vh-80px)] lg:h-screen flex flex-col relative">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Unlock className="w-5 h-5 text-[#10b981]" />
            <h1 className="text-2xl font-semibold">Vault</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Encrypted storage. Auto-locks in 2 mins or on exit.</p>
        </div>
        <button 
          onClick={() => setVaultToken(null)}
          className="text-sm font-medium px-3 py-1.5 bg-[var(--bg-surface-raised)] rounded hover:text-white transition-colors"
        >
          Lock Now
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 space-y-3">
        {entries.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-secondary)] mt-12">Vault is empty.</p>
        ) : (
          entries.map(entry => {
            let borderColor = 'border-[var(--border-hairline)]';
            if (entry.category === 'dsa') borderColor = 'border-l-[var(--warning)]';
            else if (entry.category === 'dev') borderColor = 'border-l-[#10b981]';
            else if (entry.category === 'financial') borderColor = 'border-l-[#8b5cf6]';

            return (
              <div key={entry.id} className={`p-4 bg-[var(--bg-surface)] border-y border-r border-l-4 ${borderColor} rounded-lg flex items-center justify-between`}>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-tertiary)] block mb-1">{entry.category}</span>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{entry.label}</p>
                </div>
                <button 
                  onClick={() => revealAndCopy(entry.id)}
                  className="px-3 py-1.5 bg-[var(--bg-surface-raised)] hover:bg-[#10b981] hover:text-[var(--bg-base)] text-xs font-medium rounded transition-colors"
                >
                  Copy Secret
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* FAB for Vault only appears when unlocked */}
      <button
        onClick={() => setIsAdding(true)}
        className="fixed bottom-[100px] lg:bottom-12 right-6 lg:right-12 w-14 h-14 bg-[var(--accent)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Slide-in Add Panel */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-[var(--bg-surface)] border-l border-[var(--border-hairline)] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[100] ${isAdding ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-medium">Add Secret</h2>
            <button onClick={() => setIsAdding(false)} className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5"/></button>
          </div>

          <form onSubmit={handleAddEntry} className="space-y-6 flex-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Label</label>
              <input required value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Supabase API Key" className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
                <option value="dsa">DSA</option>
                <option value="dev">Dev</option>
                <option value="financial">Financial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)] flex justify-between">
                Value
                <button type="button" onClick={() => setShowValue(!showValue)} className="text-xs hover:text-white">{showValue ? 'Hide' : 'Show'}</button>
              </label>
              <input required type={showValue ? 'text' : 'password'} value={newValue} onChange={e => setNewValue(e.target.value)} className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-[var(--accent)]" />
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full bg-[#10b981] text-[var(--bg-base)] font-medium py-2.5 rounded-md hover:bg-opacity-90 transition-colors text-sm">
                Encrypt & Save
              </button>
            </div>
          </form>
        </div>
      </div>
      {isAdding && <div className="fixed inset-0 bg-black/40 z-[90] backdrop-blur-sm" onClick={() => setIsAdding(false)} />}
    </div>
  );
}
