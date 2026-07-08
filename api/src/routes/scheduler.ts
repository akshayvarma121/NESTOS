import { Router } from 'express';
import { supabase } from '../supabase.js';
import { recomputeSchedule, MacroGoal } from '../scheduler/index.js';

const router = Router();

// POST /api/scheduler/recompute
router.post('/recompute', async (req, res) => {
  // 1. Fetch all active macro goals and their tasks
  const { data: goals, error: goalsError } = await supabase
    .from('pos_macro_goals')
    .select(`
      id,
      deadline,
      pos_micro_tasks ( id, macro_id, scheduled_date, status )
    `)
    .eq('status', 'active');

  if (goalsError) return res.status(500).json({ error: goalsError.message });

  // 2. Format for pure function
  const todayStr = new Date().toISOString().split('T')[0];
  
  const formattedGoals: MacroGoal[] = goals.map((g: any) => ({
    id: g.id,
    deadline: g.deadline,
    tasks: g.pos_micro_tasks
  }));

  // 3. Recompute
  const { tasksToUpdate } = recomputeSchedule(formattedGoals, todayStr);

  if (tasksToUpdate.length === 0) {
    return res.json({ message: 'No recalibration needed', updated: 0 });
  }

  // 4. Update the DB (Supabase bulk upsert or individual updates)
  // Since we only have tasksToUpdate with id and scheduled_date, we need to fetch the rest 
  // or use a bulk update. Supabase allows bulk upsert if we provide the full row.
  // For simplicity and safety in Phase 1, we will do individual updates, or fetch the full tasks first.
  
  // Optimization: filter out tasks whose scheduled_date is already the intended one
  const actualUpdates = tasksToUpdate.filter(update => {
    const goal = formattedGoals.find(g => g.tasks.some(t => t.id === update.id));
    const task = goal?.tasks.find(t => t.id === update.id);
    return task?.scheduled_date !== update.scheduled_date;
  });

  if (actualUpdates.length === 0) {
    return res.json({ message: 'No recalibration needed', updated: 0 });
  }

  // Promise.all is fine for small batches.
  const promises = actualUpdates.map(update => 
    supabase
      .from('pos_micro_tasks')
      .update({ scheduled_date: update.scheduled_date })
      .eq('id', update.id)
  );

  await Promise.all(promises);

  res.json({ message: 'Recalibrated successfully', updated: actualUpdates.length });
});

export default router;
