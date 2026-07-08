import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Check } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import CloseDayPanel from '../components/CloseDayPanel';

const categoryColors: Record<string, string> = {
  academic: 'bg-[var(--accent)]',
  dsa: 'bg-[var(--warning)]',
  dev: 'bg-[var(--success)]',
  other: 'bg-[var(--text-secondary)]',
};

function InlineEdit({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(initialValue);

  if (editing) {
    return (
      <input
        autoFocus
        className="bg-transparent border-b border-[var(--accent)] outline-none text-[var(--text-primary)] w-full py-1"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { setEditing(false); if (val !== initialValue) onSave(val); }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
    );
  }

  return (
    <span 
      className="cursor-text hover:text-[var(--text-primary)] transition-colors py-1 block w-full"
      onClick={() => setEditing(true)}
    >
      {initialValue}
    </span>
  );
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const [isCloseDayOpen, setIsCloseDayOpen] = useState(false);
  
  // Basic time check for accenting the Close Day button
  const currentHour = new Date().getHours();
  // We can read close_hour from localStorage, default 21
  const closeHour = parseInt(localStorage.getItem('pos_close_hour') || '21');
  const isPastClose = currentHour >= closeHour;

  useEffect(() => {
    async function init() {
      try {
        await api.post('/scheduler/recompute');
        const todayStr = new Date().toISOString().split('T')[0];
        const taskData = await api.get(`/micro-tasks?date=${todayStr}`);
        setTasks(taskData);
        if (taskData.length === 0) {
          const goalsData = await api.get('/macro-goals');
          setHasGoals(goalsData.length > 0);
        } else {
          setHasGoals(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await api.patch(`/micro-tasks/${id}`, { status: newStatus });
  };

  const renameTask = async (id: string, newTitle: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
    await api.patch(`/micro-tasks/${id}`, { title: newTitle });
  };

  const handleTaskResolved = (id: string, newStatus?: string, newDate?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (newStatus) return { ...t, status: newStatus };
        if (newDate) return { ...t, scheduled_date: newDate };
      }
      return t;
    }));
  };

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Recalibrating...</div>;

  if (tasks.length === 0 && hasGoals === false) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
        <p className="text-[var(--text-secondary)]">No goals yet. Add one to start scheduling tasks.</p>
        <NavLink to="/goals" className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] px-4 py-2 rounded-lg text-sm hover:bg-[var(--border-hairline)] transition-colors">
          Go to Goals
        </NavLink>
      </div>
    );
  }

  // Filter tasks to only those scheduled for today strictly for the main view (excluding pushed to tomorrow)
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTasks = tasks.filter(t => t.scheduled_date === todayStr && t.status !== 'skipped');

  const grouped = activeTasks.reduce((acc, task) => {
    const cat = task.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Today</h1>
          <p className="text-[var(--text-secondary)] font-mono text-xs uppercase tracking-wider">{new Date().toDateString()}</p>
        </div>
        
        <button 
          onClick={() => setIsCloseDayOpen(true)}
          className={`px-3 py-1.5 text-sm font-medium rounded-[4px] border transition-colors ${
            isPastClose 
              ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg-base)] hover:bg-[var(--accent)]/90' 
              : 'bg-[var(--bg-surface-raised)] border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]'
          }`}
        >
          Close Day
        </button>
      </div>

      {activeTasks.length === 0 && hasGoals === true && (
        <p className="text-[var(--text-secondary)]">All done for today! Take a break.</p>
      )}

      {Object.entries(grouped).map(([category, catTasks]) => (
        <div key={category} className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-3">{category}</h2>
          <div className="flex flex-col gap-1.5">
            {(catTasks as any[]).map((task: any) => (
              <div 
                key={task.id} 
                className="flex items-center gap-3 group relative pl-3"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-full ${categoryColors[category] || categoryColors.other}`} />
                
                <button 
                  onClick={() => toggleTask(task.id, task.status)}
                  className={`w-5 h-5 flex-shrink-0 rounded-[4px] border ${
                    task.status === 'done' 
                      ? 'bg-[var(--text-tertiary)] border-[var(--text-tertiary)]' 
                      : 'border-[var(--border-hairline)] hover:border-[var(--text-secondary)]'
                  } flex items-center justify-center transition-colors`}
                >
                  {task.status === 'done' && <Check className="w-3.5 h-3.5 text-[var(--bg-base)]" />}
                </button>

                <div className={`flex-1 text-sm ${task.status === 'done' ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-secondary)]'}`}>
                  <InlineEdit initialValue={task.title} onSave={(newVal) => renameTask(task.id, newVal)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <CloseDayPanel 
        isOpen={isCloseDayOpen} 
        onClose={() => setIsCloseDayOpen(false)} 
        tasks={activeTasks}
        onTaskResolved={handleTaskResolved}
        onCloseDayComplete={() => {
          alert("Day closed successfully!");
        }}
      />
    </div>
  );
}
