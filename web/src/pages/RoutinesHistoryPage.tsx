import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { ArrowLeft, Check, X, Calendar, Search } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function RoutinesHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/routines/history?days=${days}`);
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // Group logs by date
  const groupedLogs = logs.reduce((acc: any, log: any) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  const filteredDates = Object.keys(groupedLogs).sort((a, b) => (a < b ? 1 : -1));

  const matchSearch = (log: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (log.routine?.title || "").toLowerCase().includes(s) ||
      (log.note || "").toLowerCase().includes(s)
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8 relative pb-32">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Focus
        </NavLink>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Routine History</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Track your consistency and review your notes.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--bg-surface-raised)] p-1 rounded-lg border border-[var(--border-hairline)]">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === 7
                  ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === 30
                  ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDays(90)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === 90
                  ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search routines or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--text-secondary)] transition-colors"
        />
      </div>

      {/* History List */}
      {loading ? (
        <div className="text-center text-[var(--text-secondary)] py-12">
          Loading history...
        </div>
      ) : filteredDates.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)] py-12 border border-dashed border-[var(--border-hairline)] rounded-xl">
          <Calendar className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p>No routine logs found for this period.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredDates.map((dateStr) => {
            const dayLogs = groupedLogs[dateStr].filter(matchSearch);
            if (dayLogs.length === 0) return null;

            const displayDate = new Date(dateStr).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            });

            return (
              <section key={dateStr} className="space-y-4">
                <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] opacity-50" />
                  {displayDate}
                </h2>
                <div className="grid gap-3">
                  {dayLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${
                        log.status === "done"
                          ? "bg-[var(--accent)]/5 border-[var(--accent)]/30"
                          : "bg-[var(--warning)]/5 border-[var(--warning)]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
                            log.status === "done"
                              ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                              : "bg-[var(--warning)]/20 text-[var(--warning)]"
                          }`}
                        >
                          {log.status === "done" ? (
                            <Check className="w-4 h-4" strokeWidth={3} />
                          ) : (
                            <X className="w-4 h-4" strokeWidth={3} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {log.routine?.title || "Unknown Routine"}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                            {log.status === "done" ? "Completed" : "Skipped/Missed"} at{" "}
                            {new Date(log.completed_at).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {log.note && (
                        <div className="mt-2 sm:mt-0 sm:ml-auto flex-1 sm:max-w-md bg-[var(--bg-base)]/50 p-3 rounded-lg border border-[var(--border-hairline)]">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                            Note
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {log.note}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
