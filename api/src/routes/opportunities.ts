import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('pos_opportunities')
    .select('*')
    .in('user_id', req.sharedSpaceIds!)
    .order('created_at', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req: AuthRequest, res) => {
  const { company, role, deadline, notes } = req.body;
  const { data, error } = await supabase
    .from('pos_opportunities')
    .insert([{ user_id: req.user!.id, company, role, deadline, notes }])
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from('pos_opportunities')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
