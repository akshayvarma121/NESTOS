import { Router } from 'express';
import { supabase } from '../supabase.js';
import { recomputeSchedule, MacroGoal } from '../scheduler/index.js';

const router = Router();

// POST /api/scheduler/recompute
router.post('/recompute', async (req, res) => {
  const { data: goals, error: goalsError } = await supabase
    .from('pos_macro_goals')
    .select(`
      id,
      deadline,
      pos_micro_tasks ( id, macro_id, scheduled_date, status, is_pinned )
    `)
    .eq('status', 'active');

  if (goalsError) return res.status(500).json({ error: goalsError.message });

  const todayStr = new Date().toISOString().split('T')[0];
  
  const formattedGoals: MacroGoal[] = goals.map((g: any) => ({
    id: g.id,
    deadline: g.deadline,
    tasks: g.pos_micro_tasks
  }));

  const { tasksToUpdate } = recomputeSchedule(formattedGoals, todayStr);

  if (tasksToUpdate.length === 0) {
    return res.json({ message: 'No recalibration needed', updated: 0 });
  }

  const actualUpdates = tasksToUpdate.filter(update => {
    const goal = formattedGoals.find(g => g.tasks.some(t => t.id === update.id));
    const task = goal?.tasks.find(t => t.id === update.id);
    return task?.scheduled_date !== update.scheduled_date || (update.is_pinned !== undefined && task?.is_pinned !== update.is_pinned);
  });

  if (actualUpdates.length === 0) {
    return res.json({ message: 'No recalibration needed', updated: 0 });
  }

  const promises = actualUpdates.map(update => {
    const updatePayload: any = { scheduled_date: update.scheduled_date };
    if (update.is_pinned !== undefined) updatePayload.is_pinned = update.is_pinned;
    
    return supabase
      .from('pos_micro_tasks')
      .update(updatePayload)
      .eq('id', update.id);
  });

  await Promise.all(promises);

  res.json({ message: 'Recalibrated successfully', updated: actualUpdates.length });
});

export default router;
