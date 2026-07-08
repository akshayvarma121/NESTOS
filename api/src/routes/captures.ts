import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('pos_content_capture')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req: AuthRequest, res) => {
  const { raw_text, tag, linked_macro_id } = req.body;
  const { data, error } = await supabase
    .from('pos_content_capture')
    .insert([{ user_id: req.user!.id, raw_text, tag, linked_macro_id }])
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id/posted', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { posted } = req.body;
  const { data, error } = await supabase
    .from('pos_content_capture')
    .update({ posted })
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
