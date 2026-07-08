import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/focus', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .select('*, macro:pos_macro_goals(category), assignee:pos_user_profiles!pos_micro_tasks_assigned_to_fkey(username)')
    .not('scheduled_date', 'is', null)
    .in('user_id', req.sharedSpaceIds!);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/unscheduled', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('pos_micro_tasks')
    .select('*, macro:pos_macro_goals(title, category), assignee:pos_user_profiles!pos_micro_tasks_assigned_to_fkey(username)')
    .is('scheduled_date', null)
    .eq('status', 'pending')
    .in('user_id', req.sharedSpaceIds!);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
