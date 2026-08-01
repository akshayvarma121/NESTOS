import { useState, useEffect } from "react";
import { api } from "../lib/api";
import GoalEditorPanel from "../components/GoalEditorPanel";
import BulkImportGoalsModal from "../components/BulkImportGoalsModal";
import GoalJsonEditorModal from "../components/GoalJsonEditorModal";
import ConfirmModal from "../components/ConfirmModal";
import {
  Target,
  Plus,
  Info,
  UploadCloud,
  Trash2,
  Code,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { usePullToRefresh } from "../lib/usePullToRefresh";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../contexts/AuthContext";

const categoryColors: Record<string, string> = {
  academic: "bg-[#ff6b6b]",
  dsa: "bg-[#ffeb3b]",
  dev: "bg-[#2ed573]",
  other: "bg-black",
};

export default function GoalsPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "you";
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [jsonEditingGoal, setJsonEditingGoal] = useState<any>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    goalId: string | null;
  }>({ isOpen: false, goalId: null });

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

  useEffect(() => {
    fetchGoals();
  }, []);

  const { isRefreshing, pullProgress } = usePullToRefresh(fetchGoals);

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

  const executeDelete = async (id: string) => {
    try {
      await api.delete(`/macro-goals/${id}`);
      await fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = (id: string) => {
    setConfirmModal({ isOpen: true, goalId: id });
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
      {/* Pull to refresh indicator */}
      {(pullProgress > 0 || isRefreshing) && (
        <div className="flex justify-center -mt-4 mb-4">
          <div
            className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-full p-2 shadow-lg transition-transform"
            style={{
              transform: `translateY(${Math.min(pullProgress * 20, 20)}px) rotate(${pullProgress * 360}deg)`,
              opacity: Math.max(pullProgress, 0.5),
            }}
          >
            <RefreshCw
              className={`w-5 h-5 text-[var(--accent)] ${isRefreshing ? "animate-spin" : ""}`}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-[var(--text-primary)]" />
            <h1 className="text-3xl font-black uppercase tracking-wider text-[var(--text-primary)]">
              Macro Goals
            </h1>
            <div className="relative group cursor-help ml-2 mt-1">
              <Info className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" />
              <div className="absolute left-0 top-full mt-2 w-64 p-4 bg-[var(--bg-surface-raised)] border-2 border-[var(--border-brutal)] brutal-shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-sm text-[var(--text-primary)] font-bold">
                Define your high-level macro goals. Break them down into small
                units (e.g. 50 chapters). The progress bar fills up as you
                complete action items.
              </div>
            </div>
          </div>
          <p className="text-sm font-bold text-[var(--text-secondary)] mt-1 ml-11">
            Command your ambitions, {name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="brutal-btn bg-white text-black px-4 py-2 text-sm font-bold flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Bulk JSON
          </button>
          <button
            onClick={openNewGoal}
            className="brutal-btn bg-[#a8e6cf] text-black px-4 py-2 text-sm font-black flex items-center gap-2 uppercase"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No goals yet"
          description="Create one to start slicing tasks and making progress."
          actionLabel="New Goal"
          onAction={openNewGoal}
        />
      ) : (
        Object.entries(grouped).map(([category, catGoals]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-black/70 mb-2">
              {category}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {(catGoals as any[]).map((goal: any) => {
                const percent = Math.min(
                  100,
                  Math.round((goal.completed_units / goal.total_units) * 100),
                );
                return (
                  <div
                    key={goal.id}
                    className="p-5 bg-white brutal-border brutal-shadow-sm space-y-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:brutal-shadow transition-transform duration-75"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-black text-lg text-black leading-tight">
                          {goal.title}
                        </h3>
                        <span className="font-bold text-xs text-black/60 uppercase tracking-wide">
                          {goal.completed_units}/{goal.total_units}{" "}
                          {goal.unit_label}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => setJsonEditingGoal(goal)}
                          className="p-2 text-black hover:bg-[#ffeb3b] brutal-border border-transparent hover:border-black transition-colors flex-shrink-0"
                          title="Edit JSON"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditGoal(goal)}
                          className="p-2 text-black hover:bg-[#a8e6cf] brutal-border border-transparent hover:border-black transition-colors flex-shrink-0"
                          title="Edit Goal"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 text-black hover:bg-[#ff6b6b] brutal-border border-transparent hover:border-black transition-colors flex-shrink-0"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Thick Progress Bar */}
                    <div className="h-4 w-full bg-[#fdfbf7] brutal-border overflow-hidden">
                      <div
                        className={`h-full ${categoryColors[category] || categoryColors.other} border-r-2 border-black`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="text-xs font-bold text-black flex justify-between uppercase">
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

      <GoalJsonEditorModal
        isOpen={!!jsonEditingGoal}
        onClose={() => setJsonEditingGoal(null)}
        onSuccess={fetchGoals}
        goal={jsonEditingGoal}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Goal?"
        message="Are you sure you want to delete this goal and all its tasks? This action cannot be undone."
        confirmText="Delete"
        danger={true}
        onCancel={() => setConfirmModal({ isOpen: false, goalId: null })}
        onConfirm={() => {
          if (confirmModal.goalId) {
            executeDelete(confirmModal.goalId);
          }
        }}
      />
    </div>
  );
}
