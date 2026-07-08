import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /api/micro-tasks?date=YYYY-MM-DD
// Also support fetching backlogged tasks
router.get('/', async (req, res) => {
  const date = req.query.date as string;
  const backlog = req.query.backlog === 'true';

  let query = supabase
    .from('pos_micro_tasks')
    .select('*, pos_macro_goals(category, title)')
    .neq('status', 'skipped')
    .neq('status', 'done') // Backlog typically hides done tasks
    .order('unit_number', { ascending: true });

  if (backlog) {
    // Backlog tasks: pending tasks that are either unscheduled or scheduled for the future
    // In our simplified scheduler, we just fetch all pending tasks for the backlog
    // However, the front end will filter out today's tasks. We'll just return all pending.
  } else if (date) {
    query = query.eq('scheduled_date', date);
    // Include done tasks for a specific date view
    query = supabase
      .from('pos_micro_tasks')
      .select('*, pos_macro_goals(category, title)')
      .eq('scheduled_date', date)
      .neq('status', 'skipped')
      .order('unit_number', { ascending: true });
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  
  // Flatten category out
  const formatted = data.map(task => ({
    ...task,
    category: task.pos_macro_goals?.category,
    macro_title: task.pos_macro_goals?.title
  }));

  res.json(formatted);
});

// PATCH /api/micro-tasks/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, scheduled_date, title, is_pinned } = req.body;

  const updates: any = {};
  if (status !== undefined) {
    updates.status = status;
    if (status === 'done') updates.completed_at = new Date().toISOString();
  }
  if (scheduled_date !== undefined) updates.scheduled_date = scheduled_date;
  if (title !== undefined) updates.title = title;
  if (is_pinned !== undefined) updates.is_pinned = is_pinned;

  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/micro-tasks/:id/split
router.post('/:id/split', async (req, res) => {
  // Not fully implementing split yet as it wasn't requested for the today/goals slice, 
  // but adding the stub.
  res.status(501).json({ message: 'Not implemented in Phase 1' });
});

export default router;
