import { useState } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import { AvatarPicker, UserAvatar } from "../components/AvatarPicker";

export default function SettingsPage() {
  const { user } = useAuth();
  const [resetConfirm, setResetConfirm] = useState("");
  const [resettingVault, setResettingVault] = useState(false);
  const [clearDataConfirm, setClearDataConfirm] = useState("");
  const [clearingData, setClearingData] = useState(false);
  const [themeTick, setThemeTick] = useState(0);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const triggerTestNotification = async (type: string) => {
    try {
      await api.post("/push/test-trigger", { type });
      toast("Push sent! Check your OS notifications.", "success");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      toast(msg, "error");
    }
  };

  const handleVaultReset = async () => {
    if (resetConfirm !== "DELETE") return;
    setResettingVault(true);
    try {
      await api.delete("/vault/reset");
      setResetConfirm("");
      toast("Vault successfully reset.", "success");
    } catch (e: any) {
      toast("Failed to reset vault: " + e.message, "error");
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
      toast("All your data has been permanently deleted.", "success");
      setTimeout(() => window.location.href = "/", 2000);
    } catch (e: any) {
      toast("Failed to clear data: " + e.message, "error");
    } finally {
      setClearingData(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatarStyle={user?.user_metadata?.avatarStyle}
          currentAvatarSeed={user?.user_metadata?.avatarSeed}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          System configuration for {user?.user_metadata?.name || user?.email?.split("@")[0] || "you"}.
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg">
              <div>
                <h3 className="text-sm font-medium">Theme</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {document.documentElement.classList.contains("dark") 
                    ? "Currently using the dark theme." 
                    : "Currently using the light theme."}
                </p>
              </div>
              <button
                onClick={() => {
                  const isDark = document.documentElement.classList.contains("dark");
                  if (isDark) {
                    document.documentElement.classList.remove("dark");
                    document.documentElement.classList.add("light");
                    localStorage.setItem("theme", "light");
                  } else {
                    document.documentElement.classList.remove("light");
                    document.documentElement.classList.add("dark");
                    localStorage.setItem("theme", "dark");
                  }
                  // Force a re-render
                  setThemeTick((prev) => prev + 1);
                }}
                className="px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-base)] text-xs font-bold uppercase tracking-wider brutal-border brutal-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                {document.documentElement.classList.contains("dark") ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4">
              <div className="flex items-center gap-4">
                <UserAvatar
                  avatarStyle={user?.user_metadata?.avatarStyle}
                  avatarSeed={user?.user_metadata?.avatarSeed}
                  initials={(user?.user_metadata?.name || user?.email || "?").substring(0, 2).toUpperCase()}
                  size="lg"
                />
                <div>
                  <h3 className="text-sm font-medium">Avatar</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Choose how you appear across the app.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="bg-[var(--text-primary)] text-[var(--bg-base)] font-bold px-4 py-2 text-xs uppercase tracking-wider brutal-border brutal-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all whitespace-nowrap"
              >
                Change Avatar
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Account</h2>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4">
              <div>
                <h3 className="text-sm font-medium">Display Name</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Your identity across the application.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="displayNameInput"
                  defaultValue={user?.user_metadata?.name || ""}
                  placeholder="Your Name"
                  className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[var(--text-primary)] w-full md:w-48"
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById("displayNameInput") as HTMLInputElement;
                    if (!input.value.trim()) return;
                    try {
                      await supabase.auth.updateUser({ data: { name: input.value.trim() } });
                      toast("Name updated successfully! Refresh the page to see changes.", "success");
                    } catch (e: any) {
                      toast("Failed to update name: " + e.message, "error");
                    }
                  }}
                  className="bg-[var(--text-primary)] text-[var(--bg-base)] font-bold px-3 py-1.5 rounded-md text-xs hover:opacity-90 transition-opacity whitespace-nowrap brutal-border brutal-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4">
              <div>
                <h3 className="text-sm font-medium">Country (Holidays)</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Used for displaying national holidays in your calendar.
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  id="countryInput"
                  defaultValue={user?.user_metadata?.country || "US"}
                  className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[var(--text-primary)] w-full md:w-48 text-[var(--text-primary)]"
                >
                  <option value="IN">India (IN)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="AU">Australia (AU)</option>
                  <option value="DE">Germany (DE)</option>
                </select>
                <button
                  onClick={async () => {
                    const input = document.getElementById("countryInput") as HTMLSelectElement;
                    if (!input.value) return;
                    try {
                      await supabase.auth.updateUser({ data: { country: input.value } });
                      toast("Country updated successfully! Refresh the page to see changes.", "success");
                    } catch (e: any) {
                      toast("Failed to update country: " + e.message, "error");
                    }
                  }}
                  className="bg-[var(--text-primary)] text-[var(--bg-base)] font-bold px-3 py-1.5 rounded-md text-xs hover:opacity-90 transition-opacity whitespace-nowrap brutal-border brutal-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  Save
                </button>
              </div>
            </div>

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
              onClick={() => supabase.auth.signOut()}
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

        <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Notifications Setup</h2>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg gap-4">
              <div>
                <h3 className="text-sm font-medium">Test Push Notifications</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Trigger an immediate test push notification to verify your device is receiving them.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => triggerTestNotification("backlog")}
                  className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-3 py-1.5 rounded-md text-xs hover:border-[var(--text-primary)] transition-colors"
                >
                  Test Backlog
                </button>
                <button
                  onClick={() => triggerTestNotification("morning")}
                  className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] px-3 py-1.5 rounded-md text-xs hover:border-[var(--text-primary)] transition-colors"
                >
                  Test Morning
                </button>
              </div>
            </div>
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
              <h3 className="text-sm font-medium">
                Clear All Data (Factory Reset)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3">
                This will permanently delete all your goals, tasks, routines,
                notes, captures, and vault entries. Your account and partner
                connection will remain intact. Type{" "}
                <span className="font-mono text-red-400">CLEAR</span> to
                confirm.
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
