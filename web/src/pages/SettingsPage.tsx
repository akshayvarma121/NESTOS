import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const [resetConfirm, setResetConfirm] = useState("");
  const [resettingVault, setResettingVault] = useState(false);
  const [clearDataConfirm, setClearDataConfirm] = useState("");
  const [clearingData, setClearingData] = useState(false);
  
  const { signOut } = useAuth();

  const handleVaultReset = async () => {
    if (resetConfirm !== "DELETE") return;
    setResettingVault(true);
    try {
      await api.delete("/vault/reset");
      setResetConfirm("");
      alert("Vault successfully reset.");
    } catch (e: any) {
      alert("Failed to reset vault: " + e.message);
    } finally {
      setResettingVault(false);
    }
  };

  const handleClearData = async () => {
    if (clearDataConfirm !== "CLEAR") return;
    setClearingData(true);
    try {
      await api.delete("/account/clear-data");
      setClearDataConfirm("");
      alert("All your data has been permanently deleted.");
      window.location.href = "/";
    } catch (e: any) {
      alert("Failed to clear data: " + e.message);
    } finally {
      setClearingData(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          System configuration.
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg">
              <div>
                <h3 className="text-sm font-medium">Light Mode</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Toggle brutalist light mode theme.
                </p>
              </div>
              <button
                onClick={() => {
                  const isLight =
                    document.documentElement.classList.toggle("light");
                  localStorage.setItem("theme", isLight ? "light" : "dark");
                }}
                className="px-3 py-1.5 bg-[var(--text-primary)] text-[var(--bg-base)] text-xs font-medium rounded hover:opacity-90 transition-opacity"
              >
                Toggle Theme
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Account</h2>
          <div className="space-y-4">
            <a
              href="/partner"
              className="flex items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg hover:border-[var(--text-primary)] transition-colors"
            >
              <div>
                <h3 className="text-sm font-medium">Partner Network</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  View your invite code or link a partner.
                </p>
              </div>
              <span className="text-[var(--text-tertiary)]">→</span>
            </a>
            
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg hover:border-red-500/50 hover:bg-red-500/5 transition-colors group"
            >
              <div className="text-left">
                <h3 className="text-sm font-medium text-red-500">Log Out</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Sign out of your account on this device.
                </p>
              </div>
              <LogOut className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </section>
        <section className="bg-[var(--bg-surface)] border border-red-900/30 rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4 text-red-500">Danger Zone</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Reset Vault PIN</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3">
                Forgotten PINs cannot be recovered. Resetting the vault will
                permanently destroy all existing encrypted entries. Type{" "}
                <span className="font-mono text-red-400">DELETE</span> to
                confirm.
              </p>
              <div className="flex gap-3">
                <input
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className="flex-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-red-500"
                />
                <button
                  onClick={handleVaultReset}
                  disabled={resetConfirm !== "DELETE" || resettingVault}
                  className="bg-red-500 text-white font-medium px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                >
                  {resettingVault ? "Resetting..." : "Factory Reset Vault"}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-red-900/30">
              <h3 className="text-sm font-medium">Clear All Data (Factory Reset)</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3">
                This will permanently delete all your goals, tasks, routines, notes, captures, and vault entries.
                Your account and partner connection will remain intact. Type{" "}
                <span className="font-mono text-red-400">CLEAR</span> to confirm.
              </p>
              <div className="flex gap-3">
                <input
                  value={clearDataConfirm}
                  onChange={(e) => setClearDataConfirm(e.target.value)}
                  placeholder="Type CLEAR"
                  className="flex-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-sm outline-none focus:border-red-500"
                />
                <button
                  onClick={handleClearData}
                  disabled={clearDataConfirm !== "CLEAR" || clearingData}
                  className="bg-red-500 text-white font-medium px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {clearingData ? "Wiping Data..." : "Wipe All Data"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
