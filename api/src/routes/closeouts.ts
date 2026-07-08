import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req: AuthRequest, res) => {
  const { total_scheduled, total_completed, rollover_count } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('pos_daily_closeouts')
    .insert([{
      user_id: req.user!.id,
      date: todayStr,
      total_scheduled,
      total_completed,
      rollover_count
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Already closed out for today' });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

export default router;
