import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// POST /api/close-day
router.post('/', async (req, res) => {
  const { date, tasks_planned, tasks_done, tasks_rolled_over } = req.body;

  if (!date) return res.status(400).json({ error: 'date is required' });

  // 1. Insert Daily Closeout summary
  const { data: closeout, error: closeoutError } = await supabase
    .from('pos_daily_closeouts')
    .insert([{
      date,
      tasks_planned,
      tasks_done,
      tasks_rolled_over
    }])
    .select()
    .single();

  if (closeoutError) {
    if (closeoutError.code === '23505') { // Unique constraint violation (already closed)
      return res.status(400).json({ error: 'This day is already closed.' });
    }
    return res.status(500).json({ error: closeoutError.message });
  }

  res.status(201).json(closeout);
});

export default router;
