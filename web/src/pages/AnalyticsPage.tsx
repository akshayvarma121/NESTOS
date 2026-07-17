import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { ArrowLeft, Check, X, Calendar, Search, Activity, Target } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

export default function AnalyticsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{
    routineTrends: any[];
    sliceTrends: any[];
    taskLogs?: any[];
    suggestion?: { text: string; type: "warning" | "success" | "info" };
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [search, setSearch] = useState("");
  const [partners, setPartners] = useState<{id: string, username: string}[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = targetUserId ? `&target_user_id=${targetUserId}` : "";
      const [historyData, analyticsData, partnerData] = await Promise.all([
        api.get(`/routines/history?days=${days}${q}`),
        api.get(`/analytics?days=${days}${q}`),
        api.get("/partner/space")
      ]);
      setLogs(historyData || []);
      setAnalytics(analyticsData || { routineTrends: [], sliceTrends: [] });
      setPartners(partnerData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, targetUserId]);

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

  // Calculate KPIs
  const totalRoutinesDone = analytics?.routineTrends.reduce((sum, d) => sum + (d.done || 0), 0) || 0;
  const totalRoutinesSkipped = analytics?.routineTrends.reduce((sum, d) => sum + (d.skipped || 0), 0) || 0;
  const adherenceRate = totalRoutinesDone + totalRoutinesSkipped > 0 
    ? Math.round((totalRoutinesDone / (totalRoutinesDone + totalRoutinesSkipped)) * 100) 
    : 0;

  const totalSlicesDone = analytics?.sliceTrends.reduce((sum, d) => sum + (d.completed || 0), 0) || 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 relative pb-32">
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
            <h1 className="text-2xl font-semibold">Productivity Analytics</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Analyze your routine consistency and goal execution.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {partners.length > 0 && (
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg px-3 py-1.5 text-sm outline-none font-medium"
              >
                <option value="">My Analytics</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.username}'s Analytics</option>
                ))}
              </select>
            )}
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
                onClick={() => setDays(14)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  days === 14
                    ? "bg-[var(--bg-base)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                14 Days
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
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-[var(--text-secondary)] py-12">
          Loading Analytics...
        </div>
      ) : (
        <>
          {/* AI Suggestion Banner */}
          {analytics?.suggestion && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
                analytics.suggestion.type === "warning"
                  ? "bg-[var(--warning)]/5 border-[var(--warning)]/20 text-[var(--warning)]"
                  : "bg-[var(--accent)]/5 border-[var(--accent)]/20 text-[var(--accent)]"
              }`}
            >
              <div className="mt-0.5">
                {analytics.suggestion.type === "warning" ? (
                  <Activity className="w-5 h-5" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  {analytics.suggestion.type === "warning" ? "Burnout Warning" : "Great Job!"}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed text-[var(--text-primary)]">
                  {analytics.suggestion.text}
                </p>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] p-5 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                  Routine Adherence
                </p>
                <div className="text-2xl font-bold">{adherenceRate}%</div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] p-5 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                  Routines Completed
                </p>
                <div className="text-2xl font-bold">{totalRoutinesDone}</div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] p-5 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                  Macro Slices Done
                </p>
                <div className="text-2xl font-bold">{totalSlicesDone}</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Routine Adherence Chart */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 rounded-xl shadow-sm">
                <h2 className="text-sm font-semibold mb-6">Routine Adherence Over Time</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.routineTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        stroke="var(--text-tertiary)" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-surface-raised)', borderColor: 'var(--border-hairline)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="done" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="skipped" name="Skipped" stackId="a" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Macro Slices Area Chart */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-6 rounded-xl shadow-sm">
                <h2 className="text-sm font-semibold mb-6">Macro Goal Execution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.sliceTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        stroke="var(--text-tertiary)" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-surface-raised)', borderColor: 'var(--border-hairline)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="scheduled" name="Scheduled" stroke="var(--text-tertiary)" fill="var(--bg-surface-raised)" strokeWidth={2} />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* History List Header */}
          <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-8">
            <h2 className="text-lg font-semibold">Routine Log Book</h2>
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
          {filteredDates.length === 0 ? (
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

          {/* Task Logs */}
          <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-8 mt-12">
            <h2 className="text-lg font-semibold">Task Log Book</h2>
          </div>
          {(!analytics?.taskLogs || analytics.taskLogs.length === 0) ? (
            <div className="text-center text-[var(--text-secondary)] py-12 border border-dashed border-[var(--border-hairline)] rounded-xl">
              <Check className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-3" />
              <p>No tasks completed in this period.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.taskLogs.map((log: any, idx: number) => (
                <div
                  key={`${log.type}-${idx}`}
                  className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)]">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {log.title}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                        Completed at {new Date(log.completed_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} on {new Date(log.completed_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-surface-raised)] px-2 py-1 rounded">
                    {log.type === "macro" ? "Macro Task" : "Personal"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
