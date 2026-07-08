import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req: AuthRequest, res) => {
  const { macro_id, title, urgency } = req.body;
  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .insert([{ user_id: req.user!.id, macro_id, title, urgency }])
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
