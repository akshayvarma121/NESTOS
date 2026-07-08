import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req: AuthRequest, res) => {
  const { title, category, total_units } = req.body;
  const { data, error } = await supabase
    .from('pos_macro_goals')
    .insert([{ user_id: req.user!.id, title, category, total_units }])
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('pos_macro_goals')
    .select('*, micro_tasks:pos_micro_tasks(status)')
    .eq('user_id', req.user!.id);
    
  if (error) return res.status(500).json({ error: error.message });

  // Map progress correctly
  const enriched = data.map((goal: any) => {
    const total_completed = goal.micro_tasks.filter((t: any) => t.status === 'completed').length;
    return {
      ...goal,
      completed_units: total_completed
    };
  });
  
  res.json(enriched);
});

export default router;
