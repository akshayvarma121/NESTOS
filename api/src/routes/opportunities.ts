import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /api/opportunities
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('pos_opportunities')
    .select('*')
    // We do not strict sort here because the frontend will do auto-sorting by deadline per FR-7.3
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/opportunities
router.post('/', async (req, res) => {
  const { company, role, source_link, notes, deadline } = req.body;

  const { data, error } = await supabase
    .from('pos_opportunities')
    .insert([{ company, role, source_link, notes, deadline }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/opportunities/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  
  // If stage changed, update stage_updated_at
  if (updates.stage !== undefined) {
    updates.stage_updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('pos_opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
