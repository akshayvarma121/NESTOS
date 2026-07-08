import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Check, Info } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import EditTimetablePanel from '../components/EditTimetablePanel';
import CountdownTimer from '../components/CountdownTimer';

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

export default function FocusPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [personalTodos, setPersonalTodos] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [dashboardNotes, setDashboardNotes] = useState<any[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchFocusData = async () => {
    try {
      await api.post('/scheduler/recompute');
      
      const [taskData, membersData, routinesData, personalData, deadlinesData, notesData] = await Promise.all([
        api.get('/scheduler/focus'),
        api.get('/partner/space'),
        api.get(`/routines/day?day=${new Date().toLocaleDateString('en-US', { weekday: 'short' })}&date=${todayStr}`),
        api.get('/personal-todos'),
        api.get('/deadlines'),
        api.get('/notes')
      ]);
      
      setTasks(taskData);
      setSpaceMembers(membersData);
      setRoutines(routinesData || []);
      setPersonalTodos(personalData || []);
      setDeadlines(deadlinesData || []);
      setDashboardNotes((notesData || []).filter((n: any) => n.type === 'dashboard'));
      
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
  };

  useEffect(() => {
    fetchFocusData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const changeAssignee = async (id: string, assignee_id: string | null) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const member = spaceMembers.find(m => m.user_id === assignee_id);
        return { ...t, assigned_to: assignee_id, assignee: member ? { username: member.username } : null };
      }
      return t;
    }));
    await api.patch(`/micro-tasks/${id}`, { assigned_to: assignee_id });
  };


  const togglePersonalTodo = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    setPersonalTodos(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await api.patch(`/personal-todos/${id}`, { status: newStatus });
  };

  const deletePersonalTodo = async (id: string) => {
    setPersonalTodos(prev => prev.filter(t => t.id !== id));
    await api.delete(`/personal-todos/${id}`);
  };

  const addPersonalTodo = async (title: string) => {
    if (!title.trim()) return;
    const tempId = `temp-${Date.now()}`;
    setPersonalTodos(prev => [...prev, { id: tempId, title, status: 'pending' }]);
    
    try {
      const data = await api.post('/personal-todos', { title });
      setPersonalTodos(prev => prev.map(t => t.id === tempId ? data : t));
    } catch (e) {
      setPersonalTodos(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const activeDeadlines = deadlines.filter(d => new Date(d.deadline) > new Date()).slice(0, 3); // show up to 3 upcoming

  if (loading) return <div className="p-6 text-[var(--text-secondary)]">Recalibrating Focus...</div>;

  if (tasks.length === 0 && routines.length === 0 && hasGoals === false) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4">
        <p className="text-[var(--text-secondary)]">No goals or routines yet.</p>
        <div className="flex gap-4">
          <NavLink to="/goals" className="bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] px-4 py-2 rounded-lg text-sm hover:bg-[var(--border-hairline)] transition-colors">
            Go to Goals
          </NavLink>
          <button 
            onClick={() => setIsTimetableOpen(true)}
            className="bg-[var(--accent)] text-[var(--bg-base)] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Setup Timetable
          </button>
        </div>
        <EditTimetablePanel isOpen={isTimetableOpen} onClose={() => setIsTimetableOpen(false)} onUpdate={fetchFocusData} />
      </div>
    );
  }

  // Active tasks mean they are not skipped
  const activeTasks = tasks.filter(t => t.status !== 'skipped');

  const todayTasks = activeTasks.filter(t => t.scheduled_date === todayStr);
  const upcomingTasks = activeTasks.filter(t => t.scheduled_date !== todayStr && t.scheduled_date > todayStr);
  const overdueTasks = activeTasks.filter(t => t.scheduled_date !== todayStr && t.scheduled_date < todayStr && t.status !== 'done');

  // Helper to group by subject
  const groupBySubject = (taskList: any[]) => {
    return taskList.reduce((acc, task) => {
      const cat = task.category || task.macro?.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(task);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const todayGrouped = groupBySubject(todayTasks);
  const upcomingGrouped = groupBySubject(upcomingTasks);
  const overdueGrouped = groupBySubject(overdueTasks);

  const renderSubjectGroup = (groupedData: Record<string, any[]>) => {
    return Object.entries(groupedData).map(([category, catTasks]) => (
      <div key={category} className="space-y-2">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] mb-2 pl-3">{category}</h3>
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

              {/* Show date label if not today */}
              {task.scheduled_date !== todayStr && (
                <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] mr-2 bg-[var(--bg-surface-raised)] px-1.5 py-0.5 rounded border border-[var(--border-hairline)]">
                  {new Date(task.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
              
              {/* Assignee Dropdown */}
              <select 
                className={`text-xs bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded px-1.5 py-0.5 outline-none hover:border-[var(--text-secondary)] transition-colors ${task.status === 'done' ? 'opacity-50 pointer-events-none' : ''}`}
                value={task.assigned_to || ''}
                onChange={e => changeAssignee(task.id, e.target.value || null)}
              >
                <option value="">Anyone</option>
                {spaceMembers.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.username}</option>
                ))}
              </select>

            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-12 relative pb-32">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold">Focus Dashboard</h1>
            <div className="relative group cursor-help">
              <Info className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" />
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-xs text-[var(--text-secondary)]">
                This page shows your daily tasks, timetable, and upcoming deadlines. Tasks are automatically pulled from your Goals or Backlog. Private tasks are strictly hidden from partners.
              </div>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] font-mono text-xs uppercase tracking-wider">{new Date().toDateString()}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsTimetableOpen(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-[4px] border bg-[var(--bg-surface-raised)] border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
          >
            Timetable
          </button>
        </div>
      </div>

      {/* STICKY NOTES */}
      {dashboardNotes.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {dashboardNotes.map(note => {
            const colorClass = 
              note.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
              note.color === 'pink' ? 'bg-pink-500/20 text-pink-500 border-pink-500/30' :
              note.color === 'blue' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
              'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
            
            return (
              <div key={note.id} className={`p-4 border rounded-xl flex flex-col gap-2 min-h-[100px] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform ${colorClass}`}>
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-[10px] font-mono uppercase">Sticky</span>
                  <span className="text-[10px] font-mono">{note.creator?.username || 'You'}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            );
          })}
        </section>
      )}

      {/* DAILY ROUTINE TIMETABLE */}
      {routines.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium border-b border-[var(--border-hairline)] pb-2 flex items-center justify-between">
            <span>Daily Routine</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routines.map(routine => (
              <button
                key={routine.id}
                onClick={async () => {
                  // Optimistic
                  setRoutines(prev => prev.map(r => r.id === routine.id ? { ...r, is_completed: !r.is_completed } : r));
                  try {
                    await api.post(`/routines/${routine.id}/toggle`, { date: todayStr });
                  } catch (e) {
                    fetchFocusData(); // Revert on error
                  }
                }}
                className={`flex items-center gap-4 p-3 rounded-xl border text-left transition-colors ${
                  routine.is_completed 
                    ? 'bg-[var(--bg-surface-raised)] border-[var(--border-hairline)] opacity-60' 
                    : 'bg-[var(--bg-surface)] border-[var(--border-hairline)] hover:border-[var(--text-secondary)]'
                }`}
              >
                <div className={`w-5 h-5 flex-shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
                  routine.is_completed ? 'bg-[var(--text-tertiary)] border-[var(--text-tertiary)]' : 'border-[var(--text-tertiary)]'
                }`}>
                  {routine.is_completed && <Check className="w-3.5 h-3.5 text-[var(--bg-base)]" />}
                </div>
                <div>
                  <div className={`text-sm font-medium flex items-center gap-2 ${routine.is_completed ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                    {routine.title}
                    {routine.assignee?.username && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-hairline)] no-underline text-[var(--text-secondary)]">
                        {routine.assignee.username}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                    {routine.time_label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* OVERDUE */}
      {overdueTasks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-red-500 border-b border-red-900/30 pb-2">Overdue Action Items</h2>
          <div className="p-4 rounded-xl bg-red-950/10 border border-red-900/20 space-y-4">
            {renderSubjectGroup(overdueGrouped)}
          </div>
        </section>
      )}

      {/* TODAY */}
      {(todayTasks.length > 0 || routines.length === 0) && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium border-b border-[var(--border-hairline)] pb-2 flex items-center justify-between">
            <span>Today's Horizon</span>
            <span className="text-xs font-mono text-[var(--text-tertiary)]">{todayTasks.length} tasks</span>
          </h2>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-4 pl-3">Nothing scheduled for today. Relax, or pull something from the Backlog.</p>
          ) : (
            <div className="space-y-6">
              {renderSubjectGroup(todayGrouped)}
            </div>
          )}
        </section>
      )}

      {/* UPCOMING */}
      {upcomingTasks.length > 0 && (
        <section className="space-y-4 pt-8">
          <h2 className="text-sm font-medium border-b border-[var(--border-hairline)] pb-2 flex items-center justify-between text-[var(--text-secondary)]">
            <span>Upcoming Horizon</span>
            <span className="text-xs font-mono text-[var(--text-tertiary)]">{upcomingTasks.length} tasks</span>
          </h2>
          <div className="space-y-6 opacity-75 hover:opacity-100 transition-opacity">
            {renderSubjectGroup(upcomingGrouped)}
          </div>
        </section>
      )}

      {/* PRIVATE FOCUS */}
      <section className="space-y-4 pt-12">
        <h2 className="text-sm font-medium border-b border-[var(--border-hairline)] pb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">Private Focus <span className="text-[10px] bg-[var(--text-secondary)] text-[var(--bg-base)] px-1.5 py-0.5 rounded font-mono uppercase">Only You</span></span>
        </h2>
        <div className="space-y-2 bg-[var(--bg-surface-raised)] border border-[var(--border-hairline)] rounded-xl p-4">
          {personalTodos.map(todo => (
            <div key={todo.id} className="flex items-center gap-3 group">
              <button 
                onClick={() => togglePersonalTodo(todo.id, todo.status)}
                className={`w-4 h-4 flex-shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
                  todo.status === 'done' 
                    ? 'bg-[var(--text-tertiary)] border-[var(--text-tertiary)]' 
                    : 'border-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                }`}
              >
                {todo.status === 'done' && <Check className="w-3 h-3 text-[var(--bg-base)]" />}
              </button>
              <div className={`flex-1 text-sm ${todo.status === 'done' ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>
                {todo.title}
              </div>
              <button 
                onClick={() => deletePersonalTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-red-500 text-xs transition-all"
              >
                Delete
              </button>
            </div>
          ))}
          <input 
            type="text" 
            placeholder="Add a private to-do... (Press Enter)"
            className="w-full bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] pt-2 border-t border-[var(--border-hairline)] mt-2"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                addPersonalTodo(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </section>


      <EditTimetablePanel 
        isOpen={isTimetableOpen} 
        onClose={() => setIsTimetableOpen(false)} 
        onUpdate={fetchFocusData} 
      />
    </div>
  );
}
