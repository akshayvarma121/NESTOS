import { Router } from 'express';
import { supabase } from '../supabase.js';
import crypto from 'crypto';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const vaultSessions = new Map<string, { aesKey: Buffer, expiresAt: number, userId: string }>();

function getValidSessionKey(token: string, userId: string): Buffer | null {
  const session = vaultSessions.get(token);
  if (!session) return null;
  if (session.userId !== userId) return null;
  if (Date.now() > session.expiresAt) {
    vaultSessions.delete(token);
    return null;
  }
  return session.aesKey;
}

const ITERATIONS = 100000;
const KEY_LEN = 32;
const DIGEST = 'sha256';

function deriveVerifyHash(pin: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(pin, salt, ITERATIONS, KEY_LEN, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

function deriveEncryptionKey(pin: string, salt: string): Promise<Buffer> {
  const contextSalt = salt + "_encryption_key";
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(pin, contextSalt, ITERATIONS, KEY_LEN, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

router.get('/status', async (req: AuthRequest, res) => {
  const { data, error } = await supabase.from('pos_vault_security').select('user_id').eq('user_id', req.user!.id).limit(1).single();
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json({ isSetup: !!data });
});

router.post('/setup', async (req: AuthRequest, res) => {
  const { pin } = req.body;
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'Invalid PIN' });

  const { data: existing } = await supabase.from('pos_vault_security').select('user_id').eq('user_id', req.user!.id).limit(1).single();
  if (existing) return res.status(400).json({ error: 'Vault already configured' });

  const salt = crypto.randomBytes(16).toString('hex');
  const verifyHash = await deriveVerifyHash(pin, salt);

  const { error } = await supabase.from('pos_vault_security').insert([{
    user_id: req.user!.id,
    salt,
    pin_verify_hash: verifyHash
  }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.post('/unlock', async (req: AuthRequest, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });

  const { data: security, error } = await supabase.from('pos_vault_security').select('*').eq('user_id', req.user!.id).limit(1).single();
  if (error || !security) return res.status(400).json({ error: 'Vault not setup' });

  if (security.locked_until && new Date(security.locked_until).getTime() > Date.now()) {
    return res.status(403).json({ error: 'Vault is locked. Try again later.' });
  }

  const hash = await deriveVerifyHash(pin, security.salt);
  
  if (hash !== security.pin_verify_hash) {
    const attempts = security.failed_attempts + 1;
    let locked_until = null;
    if (attempts >= 4) {
      locked_until = new Date(Date.now() + 5 * 60000).toISOString();
    }
    await supabase.from('pos_vault_security')
      .update({ failed_attempts: attempts, locked_until })
      .eq('user_id', req.user!.id);
    
    return res.status(401).json({ error: 'Incorrect PIN' });
  }

  await supabase.from('pos_vault_security')
    .update({ failed_attempts: 0, locked_until: null })
    .eq('user_id', req.user!.id);

  const aesKey = await deriveEncryptionKey(pin, security.salt);
  const token = crypto.randomUUID();
  
  vaultSessions.set(token, {
    aesKey,
    expiresAt: Date.now() + 5 * 60000,
    userId: req.user!.id
  });

  res.json({ token });
});

router.get('/entries', async (req: AuthRequest, res) => {
  const { data, error } = await supabase.from('pos_vault_entries').select('id, label, category, created_at').eq('user_id', req.user!.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/entries', async (req: AuthRequest, res) => {
  const token = req.headers['x-vault-token'] as string;
  const aesKey = getValidSessionKey(token, req.user!.id);
  if (!aesKey) return res.status(401).json({ error: 'Vault locked or session expired' });

  const { label, category, value } = req.body;
  if (!label || !category || !value) return res.status(400).json({ error: 'Missing fields' });

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  const finalCiphertext = encrypted + ':' + authTag;

  const { data, error } = await supabase.from('pos_vault_entries').insert([{
    user_id: req.user!.id,
    label,
    category,
    encrypted_value: finalCiphertext,
    iv: iv.toString('hex')
  }]).select('id, label, category, created_at').single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/entries/:id/reveal', async (req: AuthRequest, res) => {
  const token = req.headers['x-vault-token'] as string;
  const aesKey = getValidSessionKey(token, req.user!.id);
  if (!aesKey) return res.status(401).json({ error: 'Vault locked or session expired' });

  const { id } = req.params;
  const { data, error } = await supabase.from('pos_vault_entries').select('*').eq('id', id).eq('user_id', req.user!.id).single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });

  try {
    const [ciphertext, authTagHex] = data.encrypted_value.split(':');
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    res.json({ value: decrypted });
  } catch (err) {
    res.status(500).json({ error: 'Decryption failed' });
  }
});

router.delete('/reset', async (req: AuthRequest, res) => {
  await supabase.from('pos_vault_entries').delete().eq('user_id', req.user!.id);
  await supabase.from('pos_vault_security').delete().eq('user_id', req.user!.id);
  
  for (const [token, session] of vaultSessions.entries()) {
    if (session.userId === req.user!.id) {
      vaultSessions.delete(token);
    }
  }
  res.json({ success: true });
});

export default router;
