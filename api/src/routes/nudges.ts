import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req: AuthRequest, res) => {
  const { partner_id, message } = req.body;
  if (!partner_id || !message) return res.status(400).json({ error: 'Missing fields' });

  // Verify connection
  const { data: connections } = await supabase
    .from('pos_partner_connections')
    .select('*')
    .or(`and(user_id.eq.${req.user!.id},partner_id.eq.${partner_id}),and(user_id.eq.${partner_id},partner_id.eq.${req.user!.id})`);

  if (!connections || connections.length === 0) {
    return res.status(403).json({ error: 'Not connected to this user' });
  }

  // Insert nudge
  const { data, error } = await supabase
    .from('pos_nudges')
    .insert([{ sender_id: req.user!.id, receiver_id: partner_id, message }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // OPTIONAL: Send a web push to the receiver right now!
  // This is a great enhancement for Phase 7 multi-tenancy.
  
  res.status(201).json(data);
});

router.get('/history', async (req: AuthRequest, res) => {
  const { data, error } = await supabase
    .from('pos_nudges')
    .select('*, sender:pos_user_profiles!pos_nudges_sender_id_fkey(username), receiver:pos_user_profiles!pos_nudges_receiver_id_fkey(username)')
    .or(`sender_id.eq.${req.user!.id},receiver_id.eq.${req.user!.id}`)
    .order('sent_at', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
