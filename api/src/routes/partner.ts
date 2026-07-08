import { Router } from 'express';
import { supabase } from '../supabase.js';
import crypto from 'crypto';

const router = Router();

// GET /api/partner/setup
router.get('/setup', async (req, res) => {
  const { data, error } = await supabase
    .from('pos_partner_link')
    .select('*')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') { // Ignore no-row error
    return res.status(500).json({ error: error.message });
  }
  res.json(data || null);
});

// POST /api/partner/setup
router.post('/setup', async (req, res) => {
  const { partner_name, partner_whatsapp_number } = req.body;
  const token = crypto.randomUUID();

  // We only support a single row for the active partner
  // So we clear existing before insert
  await supabase.from('pos_partner_link').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabase
    .from('pos_partner_link')
    .insert([{ token, partner_name, partner_whatsapp_number }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/partner/:token
// PUBLIC route, no auth. Returns stats only.
router.get('/:token', async (req, res) => {
  const { token } = req.params;

  const { data: link, error: linkErr } = await supabase
    .from('pos_partner_link')
    .select('partner_name')
    .eq('token', token)
    .single();

  if (linkErr || !link) {
    return res.status(404).json({ error: 'Invalid or revoked link' });
  }

  // Fetch Macro Goals Progress
  const { data: macroGoals } = await supabase
    .from('pos_macro_goals')
    .select('id, title, category, total_units, status')
    .neq('status', 'abandoned');

  const { data: microTasks } = await supabase
    .from('pos_micro_tasks')
    .select('id, macro_id, status, scheduled_date');

  let goalsProgress: any[] = [];
  let todayTotal = 0;
  let todayDone = 0;

  if (macroGoals && microTasks) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Calculate today's completion
    const todaysTasks = microTasks.filter(t => t.scheduled_date === todayStr);
    todayTotal = todaysTasks.length;
    todayDone = todaysTasks.filter(t => t.status === 'done').length;

    // Calculate goals progress
    goalsProgress = macroGoals.map(goal => {
      const tasksForGoal = microTasks.filter(t => t.macro_id === goal.id);
      const doneForGoal = tasksForGoal.filter(t => t.status === 'done').length;
      return {
        title: goal.title,
        category: goal.category,
        total: goal.total_units,
        completed: doneForGoal,
        percentage: goal.total_units > 0 ? Math.round((doneForGoal / goal.total_units) * 100) : 0
      };
    });
  }

  res.json({
    partner_name: link.partner_name,
    today_progress: { total: todayTotal, done: todayDone },
    goals_progress: goalsProgress
  });
});

export default router;
