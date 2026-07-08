import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/today', async (req: AuthRequest, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .select('*, macro:pos_macro_goals(category)')
    .eq('scheduled_date', todayStr)
    .eq('user_id', req.user!.id);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/unscheduled', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .select('*, macro:pos_macro_goals(title, category)')
    .is('scheduled_date', null)
    .eq('status', 'pending')
    .eq('user_id', req.user!.id);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
