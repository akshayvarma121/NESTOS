import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Users, Link as LinkIcon, UserPlus, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function PartnerPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteCode, setInviteCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [creatingProfile, setCreatingProfile] = useState(false);

  const fetchData = async () => {
    try {
      const [profRes, partRes] = await Promise.all([
        api.get("/partner/profile"),
        api.get("/partner"),
      ]);
      setProfile(profRes);
      setPartners(partRes || []);
    } catch (e: any) {
      console.error(e);
      if (!profile) setError("Failed to load partner data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setCreatingProfile(true);
    try {
      await api.post("/partner/profile", { username: newUsername });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    setConnecting(true);
    setError("");
    try {
      await api.post("/partner/add", { invite_code: inviteCode });
      setInviteCode("");
      fetchData(); // reload
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading)
    return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto pb-32">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-5 h-5 text-[var(--accent)]" />
            <h1 className="text-2xl font-semibold">Partner Network</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            Link up with friends using invite codes.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-[var(--bg-surface-raised)] hover:bg-[var(--border-hairline)] px-3 py-1.5 rounded transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[var(--text-secondary)]" /> My
            Invite Code
          </h2>

          {profile ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Share this code with your partner so they can link to your
                profile.
              </p>
              <div className="flex items-center justify-center p-6 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg">
                <span className="text-4xl font-mono tracking-[0.5em] text-[var(--text-primary)]">
                  {profile.invite_code}
                </span>
              </div>
              <p className="text-xs text-center text-[var(--text-tertiary)]">
                Logged in as {profile.username} ({user?.email})
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)] text-orange-400">
                Your profile is missing a display name due to an incomplete
                registration.
              </p>
              <form onSubmit={handleCreateProfile} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Choose a Display Name"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-4 py-2 outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={creatingProfile}
                  className="w-full bg-[var(--accent)] text-[var(--bg-base)] px-4 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {creatingProfile ? "Creating..." : "Complete Profile"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Add Partner Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[var(--text-secondary)]" /> Link a
            Partner
          </h2>

          <form onSubmit={handleConnect} className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Enter a friend's 6-character invite code to connect with them.
            </p>
            <div className="flex gap-2">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3"
                maxLength={6}
                className="flex-1 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-md px-4 py-2 font-mono text-center tracking-widest outline-none focus:border-[var(--accent)] uppercase"
              />
              <button
                type="submit"
                disabled={connecting || inviteCode.length < 6}
                className="bg-[var(--text-primary)] text-[var(--bg-base)] px-4 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {connecting ? "Linking..." : "Connect"}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Partners</h2>
          <button
            onClick={fetchData}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-surface-raised)]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-12 border border-[var(--border-hairline)] border-dashed rounded-xl text-[var(--text-secondary)]">
            You haven't linked any partners yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {partners.map((p) => (
              <div
                key={p.id}
                className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{p.username}</h3>
                  <div className="px-2 py-1 rounded bg-[var(--bg-base)] border border-[var(--border-hairline)] text-xs font-mono">
                    Today: {p.todayPercent}%
                  </div>
                </div>

                <div className="space-y-3">
                  {p.macroProgress.map((m: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)]">
                          {m.title}
                        </span>
                        <span>{m.percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border-hairline)]">
                        <div
                          className="h-full bg-[var(--accent)] transition-all duration-500"
                          style={{
                            width: `${Math.max(0, Math.min(100, m.percent))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {p.macroProgress.length === 0 && (
                    <p className="text-xs text-[var(--text-tertiary)] italic">
                      No active macro goals.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
