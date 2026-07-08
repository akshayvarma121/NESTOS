import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /api/micro-tasks?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const date = req.query.date as string;
  if (!date) return res.status(400).json({ error: 'date query param required' });

  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .select('*, pos_macro_goals(category)')
    .eq('scheduled_date', date)
    .neq('status', 'skipped')
    .order('unit_number', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  
  // Flatten category out
  const formatted = data.map(task => ({
    ...task,
    category: task.pos_macro_goals?.category
  }));

  res.json(formatted);
});

// PATCH /api/micro-tasks/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, scheduled_date, title } = req.body;

  const updates: any = {};
  if (status !== undefined) {
    updates.status = status;
    if (status === 'done') updates.completed_at = new Date().toISOString();
  }
  if (scheduled_date !== undefined) updates.scheduled_date = scheduled_date;
  if (title !== undefined) updates.title = title;

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
