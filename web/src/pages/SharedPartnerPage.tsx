import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function SharedPartnerPage() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const res = await fetch(`${API_BASE}/partner/${token}`);
        if (!res.ok) {
          throw new Error("Invalid or revoked link");
        }
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchShared();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Link Expired
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          This partner link is invalid or has been revoked.
        </p>
      </div>
    );
  }

  const { today_progress, goals_progress, partner_name } = data;
  const todayPercentage =
    today_progress.total > 0
      ? Math.round((today_progress.done / today_progress.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] p-6 md:p-12 font-sans selection:bg-[var(--accent)] selection:text-white">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            NestOS Tracker
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Real-time progress shared with {partner_name}.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
            Today's Schedule
          </h2>
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">
                  {today_progress.done} of {today_progress.total} tasks
                  completed
                </span>
                <span className="text-[var(--text-secondary)] font-mono">
                  {todayPercentage}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--bg-surface-raised)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--text-primary)] transition-all duration-1000 ease-out"
                  style={{ width: `${todayPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
            Macro Goals
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {goals_progress.map((goal: any, idx: number) => {
              let accentColor = "var(--text-primary)";
              if (goal.category === "dsa") accentColor = "var(--accent)";
              else if (goal.category === "dev") accentColor = "#10b981";

              return (
                <div
                  key={idx}
                  className="p-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl space-y-4 hover:border-[var(--text-secondary)] transition-colors"
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-tertiary)] mb-1 block">
                      {goal.category}
                    </span>
                    <h3 className="font-medium text-sm leading-snug">
                      {goal.title}
                    </h3>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-mono">
                      <span className="text-[var(--text-secondary)]">
                        {goal.completed} / {goal.total} units
                      </span>
                      <span>{goal.percentage}%</span>
                    </div>
                    <div className="h-1 bg-[var(--bg-surface-raised)] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${goal.percentage}%`,
                          backgroundColor: accentColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {goals_progress.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] sm:col-span-2">
                No active macro goals found.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
