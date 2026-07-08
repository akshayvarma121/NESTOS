import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req: AuthRequest, res) => {
  const { macro_id, title, urgency, assigned_to } = req.body;
  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .insert([{ user_id: req.user!.id, macro_id, title, urgency, assigned_to }])
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Can only update if it belongs to the shared space
  const { data: existing } = await supabase
    .from('pos_micro_tasks')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing || !req.sharedSpaceIds!.includes(existing.user_id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
