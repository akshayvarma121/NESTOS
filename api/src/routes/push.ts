import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// POST /api/push/subscribe
router.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  // Upsert subscription based on endpoint (avoiding duplicates)
  // Since we don't have a unique constraint on endpoint natively, we'll try to find it first.
  const { data: existing } = await supabase
    .from('pos_push_subscriptions')
    .select('id')
    .eq('endpoint', endpoint)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('pos_push_subscriptions')
      .update({
        keys_p256dh: keys.p256dh,
        keys_auth: keys.auth
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } else {
    const { data, error } = await supabase
      .from('pos_push_subscriptions')
      .insert([{
        endpoint,
        keys_p256dh: keys.p256dh,
        keys_auth: keys.auth
      }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
});

export default router;
