import { useState, useEffect } from "react";
import { api } from "../lib/api";
import GoalEditorPanel from "../components/GoalEditorPanel";
import BulkImportGoalsModal from "../components/BulkImportGoalsModal";
import { Target, Plus, Info, UploadCloud, Trash2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  academic: "bg-[var(--accent)]",
  dsa: "bg-[var(--warning)]",
  dev: "bg-[var(--success)]",
  other: "bg-[var(--text-secondary)]",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await api.get("/macro-goals");
      setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (goalData: any) => {
    if (editingGoal) {
      await api.put(`/macro-goals/${editingGoal.id}`, goalData);
    } else {
      await api.post("/macro-goals", goalData);
    }
    await fetchGoals();
    setEditingGoal(null);
  };

  const openNewGoal = () => {
    setEditingGoal(null);
    setIsPanelOpen(true);
  };

  const openEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setIsPanelOpen(true);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal and all its tasks?")) return;
    try {
      await api.delete(`/macro-goals/${id}`);
      await fetchGoals();
    } catch (err) {
      console.error(err);
      alert("Failed to delete goal.");
    }
  };

  if (loading)
    return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  // Group by category
  const grouped = goals.reduce(
    (acc, goal) => {
      const cat = goal.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(goal);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-2xl font-semibold">Macro Goals</h1>
          <div className="relative group cursor-help ml-2 mt-1">
            <Info className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" />
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-xs text-[var(--text-secondary)] font-normal">
              Define your high-level macro goals. Break them down into small
              units (e.g. 50 chapters). The progress bar fills up as you
              complete scheduled tasks linked to this goal.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="border border-[var(--border-hairline)] bg-[var(--bg-surface-raised)] text-[var(--text-primary)] px-3 py-1.5 rounded-[4px] text-sm font-medium flex items-center gap-1.5 hover:border-[var(--text-secondary)] transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Bulk JSON
          </button>
          <button
            onClick={openNewGoal}
            className="bg-[var(--text-primary)] text-[var(--bg-base)] px-3 py-1.5 rounded-[4px] text-sm font-medium flex items-center gap-1.5 hover:bg-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)] border border-[var(--border-hairline)] rounded-lg border-dashed">
          No goals yet. Create one to start slicing tasks.
        </div>
      ) : (
        Object.entries(grouped).map(([category, catGoals]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              {category}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(catGoals as any[]).map((goal: any) => {
                const percent = Math.min(
                  100,
                  Math.round((goal.completed_units / goal.total_units) * 100),
                );
                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-medium text-sm text-[var(--text-primary)]">
                          {goal.title}
                        </h3>
                        <span className="font-mono text-xs text-[var(--text-tertiary)]">
                          {goal.completed_units}/{goal.total_units}{" "}
                          {goal.unit_label}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => openEditGoal(goal)}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded transition-colors flex-shrink-0"
                          title="Edit Goal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors flex-shrink-0"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Thin Progress Bar */}
                    <div className="h-[2px] w-full bg-[var(--bg-base)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${categoryColors[category] || categoryColors.other}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="text-xs text-[var(--text-tertiary)] flex justify-between">
                      <span>
                        Due {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                      <span>{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <GoalEditorPanel
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleCreate}
        initialData={editingGoal}
      />

      <BulkImportGoalsModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={fetchGoals}
      />
    </div>
  );
}
