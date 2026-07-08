import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /api/captures
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('pos_content_capture')
    .select('*, pos_macro_goals(title)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/captures
router.post('/', async (req, res) => {
  const { raw_text, tag, linked_macro_id } = req.body;

  const { data, error } = await supabase
    .from('pos_content_capture')
    .insert([{ raw_text, tag, linked_macro_id }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/captures/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { posted } = req.body;

  const { data, error } = await supabase
    .from('pos_content_capture')
    .update({ posted })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
