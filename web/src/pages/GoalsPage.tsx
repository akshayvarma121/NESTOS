import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import CreateGoalPanel from '../components/CreateGoalPanel';
import { Plus } from 'lucide-react';

const categoryColors: Record<string, string> = {
  academic: 'bg-[var(--accent)]',
  dsa: 'bg-[var(--warning)]',
  dev: 'bg-[var(--success)]',
  other: 'bg-[var(--text-secondary)]',
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await api.get('/macro-goals');
      setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (goalData: any) => {
    await api.post('/macro-goals', goalData);
    await fetchGoals();
  };

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Loading...</div>;

  // Group by category
  const grouped = goals.reduce((acc, goal) => {
    const cat = goal.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Macro Goals</h1>
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="bg-[var(--text-primary)] text-[var(--bg-base)] px-3 py-1.5 rounded-[4px] text-sm font-medium flex items-center gap-1.5 hover:bg-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)] border border-[var(--border-hairline)] rounded-lg border-dashed">
          No goals yet. Create one to start slicing tasks.
        </div>
      ) : (
        Object.entries(grouped).map(([category, catGoals]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]">{category}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(catGoals as any[]).map((goal: any) => {
                const percent = Math.min(100, Math.round((goal.completed_units / goal.total_units) * 100));
                return (
                  <div key={goal.id} className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm text-[var(--text-primary)]">{goal.title}</h3>
                      <span className="font-mono text-xs text-[var(--text-tertiary)]">{goal.completed_units}/{goal.total_units} {goal.unit_label}</span>
                    </div>
                    
                    {/* Thin Progress Bar */}
                    <div className="h-[2px] w-full bg-[var(--bg-base)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${categoryColors[category] || categoryColors.other}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    
                    <div className="text-xs text-[var(--text-tertiary)] flex justify-between">
                      <span>Due {new Date(goal.deadline).toLocaleDateString()}</span>
                      <span>{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <CreateGoalPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        onSubmit={handleCreate} 
      />
    </div>
  );
}
