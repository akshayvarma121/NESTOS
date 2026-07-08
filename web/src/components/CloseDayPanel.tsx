import { useState } from 'react';
import { X, CheckCircle, CalendarDays, SkipForward } from 'lucide-react';
import { api } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: any[];
  onTaskResolved: (id: string, newStatus?: string, newDate?: string) => void;
  onCloseDayComplete: () => void;
}

export default function CloseDayPanel({ isOpen, onClose, tasks, onTaskResolved, onCloseDayComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  if (!isOpen) return null;

  const handleAction = async (task: any, action: 'done' | 'tomorrow' | 'skip') => {
    try {
      if (action === 'done') {
        onTaskResolved(task.id, 'done');
        await api.patch(`/micro-tasks/${task.id}`, { status: 'done' });
      } else if (action === 'skip') {
        onTaskResolved(task.id, 'skipped');
        await api.patch(`/micro-tasks/${task.id}`, { status: 'skipped' });
      } else if (action === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomStr = tomorrow.toISOString().split('T')[0];
        onTaskResolved(task.id, undefined, tomStr);
        await api.patch(`/micro-tasks/${task.id}`, { scheduled_date: tomStr, is_pinned: true });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const doneCount = tasks.filter(t => t.status === 'done').length;
      // Rolled over is roughly any pending tasks that were scheduled today but moved.
      // For simplicity, we assume whatever is left or was explicitly moved is rolled.
      // Actually, we can just say pendingTasks.length is rolled over if not done/skipped.
      
      await api.post('/close-day', {
        date: today,
        tasks_planned: tasks.length,
        tasks_done: doneCount,
        tasks_rolled_over: tasks.filter(t => t.status !== 'done' && t.status !== 'skipped').length
      });
      onCloseDayComplete();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      {/* Slide up on mobile, slide left on desktop */}
      <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:inset-x-auto md:right-0 w-full md:w-[450px] bg-[var(--bg-surface-raised)] border-t md:border-t-0 md:border-l border-[var(--border-hairline)] z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-right duration-200 max-h-[85vh] md:max-h-screen rounded-t-xl md:rounded-none">
        
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border-hairline)] sticky top-0 bg-[var(--bg-surface-raised)] z-10 rounded-t-xl md:rounded-none">
          <div>
            <h2 className="text-lg font-semibold">Close Day</h2>
            <p className="text-xs text-[var(--text-secondary)]">{pendingTasks.length} pending tasks to resolve</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--border-hairline)] rounded-md text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {pendingTasks.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-secondary)] space-y-4">
              <CheckCircle className="w-10 h-10 mx-auto text-[var(--success)] opacity-50" />
              <p>All clear! Ready to wrap up.</p>
            </div>
          ) : (
            pendingTasks.map(task => (
              <div key={task.id} className="p-3 bg-[var(--bg-base)] border border-[var(--border-hairline)] rounded-lg space-y-3">
                <p className="text-sm text-[var(--text-primary)]">{task.title}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(task, 'done')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[var(--success)]/10 text-[var(--success)] rounded text-xs font-medium hover:bg-[var(--success)]/20 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Done
                  </button>
                  <button onClick={() => handleAction(task, 'tomorrow')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded text-xs font-medium hover:bg-[var(--accent)]/20 transition-colors">
                    <CalendarDays className="w-3.5 h-3.5" /> Tomorrow
                  </button>
                  <button onClick={() => handleAction(task, 'skip')} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[var(--text-tertiary)]/10 text-[var(--text-secondary)] rounded text-xs font-medium hover:bg-[var(--text-tertiary)]/20 transition-colors">
                    <SkipForward className="w-3.5 h-3.5" /> Skip
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-[var(--border-hairline)] bg-[var(--bg-surface-raised)]">
          <button 
            onClick={handleFinish}
            disabled={loading || pendingTasks.length > 0}
            className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] font-medium py-2.5 rounded-md hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : 'Finish Close-Out'}
          </button>
          {pendingTasks.length > 0 && (
            <p className="text-center text-[10px] text-[var(--text-tertiary)] mt-2">Resolve all tasks to finish.</p>
          )}
        </div>

      </div>
    </>
  );
}
