import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  // Fetch notes for the user or their shared space
  const { data, error } = await supabase
    .from('pos_notes')
    .select('*, creator:pos_user_profiles!pos_notes_user_id_fkey(username)')
    .in('user_id', req.sharedSpaceIds!)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.post('/', async (req: AuthRequest, res) => {
  const { content, type, color } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const { data, error } = await supabase
    .from('pos_notes')
    .insert([{
      user_id: req.user!.id,
      content,
      type: type || 'general',
      color: color || 'yellow'
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const { content, type, color } = req.body;

  // Verify ownership or shared space
  const { data: existing } = await supabase
    .from('pos_notes')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (!existing || !req.sharedSpaceIds!.includes(existing.user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('pos_notes')
    .update({ content, type, color, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const { data: existing } = await supabase
    .from('pos_notes')
    .select('user_id')
    .eq('id', req.params.id)
    .single();

  if (!existing || !req.sharedSpaceIds!.includes(existing.user_id)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase
    .from('pos_notes')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
});

export default router;
