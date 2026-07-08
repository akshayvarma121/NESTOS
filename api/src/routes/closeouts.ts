import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req: AuthRequest, res) => {
  const { total_scheduled, total_completed, rollover_count } = req.body;
  const todayStr = new Date().toISOString().split('T')[0];

  // For shared space, ensure ONLY ONE closeout per day for the entire space!
  const { data: existing } = await supabase
    .from('pos_daily_closeouts')
    .select('id')
    .eq('date', todayStr)
    .in('user_id', req.sharedSpaceIds!)
    .limit(1)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'Space already closed out for today' });
  }

  const { data, error } = await supabase
    .from('pos_daily_closeouts')
    .insert([{
      user_id: req.user!.id, // Whoever clicked it owns the row, but it counts for the space
      date: todayStr,
      total_scheduled,
      total_completed,
      rollover_count
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

export default router;
