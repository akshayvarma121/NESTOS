import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// Used for creating a profile post-registration
router.post('/profile', requireAuth, async (req: AuthRequest, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  
  // Generate random 6-character invite code
  const invite_code = crypto.randomBytes(3).toString('hex').toUpperCase();

  const { data, error } = await supabase
    .from('pos_user_profiles')
    .insert([{ user_id: req.user!.id, username, invite_code }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('pos_user_profiles')
    .select('*')
    .eq('user_id', req.user!.id)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json(data || null); // Return null if no profile yet
});

// Add a partner using their invite code
router.post('/add', requireAuth, async (req: AuthRequest, res) => {
  const { invite_code } = req.body;
  
  // Find partner by invite code
  const { data: partner, error: partnerErr } = await supabase
    .from('pos_user_profiles')
    .select('user_id')
    .eq('invite_code', invite_code.toUpperCase())
    .single();

  if (partnerErr || !partner) return res.status(404).json({ error: 'Invalid invite code' });
  if (partner.user_id === req.user!.id) return res.status(400).json({ error: 'Cannot add yourself' });

  // Add bidirectional connection (or just one side and let the query do OR, but two rows is simpler)
  // We'll just do one row and the query will check both user_id and partner_id
  const { data, error } = await supabase
    .from('pos_partner_connections')
    .insert([{ user_id: req.user!.id, partner_id: partner.user_id }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Already connected' });
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// List all connected partners and their public progress
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  // Find all connections where user is either side
  const { data: connections, error: connErr } = await supabase
    .from('pos_partner_connections')
    .select('*')
    .or(`user_id.eq.${req.user!.id},partner_id.eq.${req.user!.id}`);

  if (connErr) return res.status(500).json({ error: connErr.message });
  
  const partnerIds = connections.map((c: any) => c.user_id === req.user!.id ? c.partner_id : c.user_id);
  
  if (partnerIds.length === 0) return res.json([]);

  // Fetch their profiles
  const { data: profiles, error: profErr } = await supabase
    .from('pos_user_profiles')
    .select('user_id, username')
    .in('user_id', partnerIds);

  if (profErr) return res.status(500).json({ error: profErr.message });

  // For each partner, fetch their stats
  const partners = await Promise.all(profiles.map(async (p: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const [macroRes, tasksRes] = await Promise.all([
      supabase.from('pos_macro_goals').select('id, title, total_units').eq('user_id', p.user_id),
      supabase.from('pos_micro_tasks').select('id, macro_id, status, scheduled_date').eq('user_id', p.user_id)
    ]);

    const macros = macroRes.data || [];
    const tasks = tasksRes.data || [];

    // Macro progress
    const macroProgress = macros.map((m: any) => {
      const completed = tasks.filter((t: any) => t.macro_id === m.id && t.status === 'completed').length;
      return { title: m.title, percent: Math.round((completed / m.total_units) * 100) };
    });

    // Today progress
    const todayTasks = tasks.filter((t: any) => t.scheduled_date === todayStr);
    const todayCompleted = todayTasks.filter((t: any) => t.status === 'completed').length;
    const todayPercent = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

    return {
      id: p.user_id,
      username: p.username,
      todayPercent,
      macroProgress
    };
  }));

  res.json(partners);
});

export default router;
