import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /api/nudges
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('pos_nudges')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/nudges
router.post('/', async (req, res) => {
  const { message } = req.body;

  // We only log the nudge because the actual delivery is via a wa.me deep link frontend-side
  const { data, error } = await supabase
    .from('pos_nudges')
    .insert([{ message, delivery_status: 'sent' }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
