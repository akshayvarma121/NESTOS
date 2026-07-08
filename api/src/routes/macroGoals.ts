import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /api/macro-goals
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('pos_macro_goals')
    .select(`
      *,
      pos_micro_tasks ( id, status )
    `)
    .neq('status', 'abandoned')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Map progress into the response
  const goalsWithProgress = data.map(goal => {
    const tasks = goal.pos_micro_tasks || [];
    const completed_units = tasks.filter((t: any) => t.status === 'done').length;
    // Don't send all tasks back, just the aggregated count
    const { pos_micro_tasks, ...goalData } = goal;
    return { ...goalData, completed_units };
  });

  res.json(goalsWithProgress);
});

// POST /api/macro-goals
router.post('/', async (req, res) => {
  const { title, category, total_units, unit_label, deadline } = req.body;

  // 1. Insert Macro Goal
  const { data: goal, error: goalError } = await supabase
    .from('pos_macro_goals')
    .insert([{ title, category, total_units, unit_label, deadline }])
    .select()
    .single();

  if (goalError) return res.status(500).json({ error: goalError.message });

  // 2. Auto-slice Micro Tasks (FR-2.1)
  const tasksToInsert = Array.from({ length: total_units }, (_, i) => ({
    macro_id: goal.id,
    unit_number: i + 1,
    title: `Unit ${i + 1}`,
  }));

  const { error: tasksError } = await supabase
    .from('pos_micro_tasks')
    .insert(tasksToInsert);

  if (tasksError) return res.status(500).json({ error: tasksError.message });

  res.status(201).json({ ...goal, completed_units: 0 });
});

// PATCH /api/macro-goals/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from('pos_macro_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/macro-goals/:id (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('pos_macro_goals')
    .update({ status: 'abandoned' })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Macro goal abandoned' });
});

export default router;
