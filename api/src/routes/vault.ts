import { Router } from 'express';
import { supabase } from '../supabase.js';
import crypto from 'crypto';

const router = Router();

// In-memory session store: Token -> { aesKey: Buffer, expiresAt: number }
const vaultSessions = new Map<string, { aesKey: Buffer, expiresAt: number }>();

function getValidSessionKey(token: string): Buffer | null {
  const session = vaultSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    vaultSessions.delete(token);
    return null;
  }
  return session.aesKey;
}

// Crypto Constants
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
  // Use a different context string for the encryption key salt to ensure it differs from the verify hash
  const contextSalt = salt + "_encryption_key";
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(pin, contextSalt, ITERATIONS, KEY_LEN, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

// Check if vault is set up
router.get('/status', async (req, res) => {
  const { data, error } = await supabase.from('pos_vault_security').select('id').limit(1).single();
  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json({ isSetup: !!data });
});

// Setup Vault PIN
router.post('/setup', async (req, res) => {
  const { pin } = req.body;
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'Invalid PIN' });

  // Ensure not already setup
  const { data: existing } = await supabase.from('pos_vault_security').select('id').limit(1).single();
  if (existing) return res.status(400).json({ error: 'Vault already configured' });

  const salt = crypto.randomBytes(16).toString('hex');
  const verifyHash = await deriveVerifyHash(pin, salt);

  const { error } = await supabase.from('pos_vault_security').insert([{
    salt,
    pin_verify_hash: verifyHash
  }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Unlock Vault
router.post('/unlock', async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });

  const { data: security, error } = await supabase.from('pos_vault_security').select('*').limit(1).single();
  if (error || !security) return res.status(400).json({ error: 'Vault not setup' });

  // Check lockout
  if (security.locked_until && new Date(security.locked_until).getTime() > Date.now()) {
    return res.status(403).json({ error: 'Vault is locked. Try again later.' });
  }

  const hash = await deriveVerifyHash(pin, security.salt);
  
  if (hash !== security.pin_verify_hash) {
    const attempts = security.failed_attempts + 1;
    let locked_until = null;
    if (attempts >= 4) {
      locked_until = new Date(Date.now() + 5 * 60000).toISOString(); // 5 mins
    }
    await supabase.from('pos_vault_security')
      .update({ failed_attempts: attempts, locked_until })
      .eq('id', security.id);
    
    return res.status(401).json({ error: 'Incorrect PIN' });
  }

  // Success
  await supabase.from('pos_vault_security')
    .update({ failed_attempts: 0, locked_until: null })
    .eq('id', security.id);

  const aesKey = await deriveEncryptionKey(pin, security.salt);
  const token = crypto.randomUUID();
  
  vaultSessions.set(token, {
    aesKey,
    expiresAt: Date.now() + 5 * 60000 // 5 minutes
  });

  res.json({ token });
});

// Get entries (no token required, only metadata)
router.get('/entries', async (req, res) => {
  const { data, error } = await supabase.from('pos_vault_entries').select('id, label, category, created_at').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add entry (requires token)
router.post('/entries', async (req, res) => {
  const token = req.headers['x-vault-token'] as string;
  const aesKey = getValidSessionKey(token);
  if (!aesKey) return res.status(401).json({ error: 'Vault locked or session expired' });

  const { label, category, value } = req.body;
  if (!label || !category || !value) return res.status(400).json({ error: 'Missing fields' });

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Store authTag appended to ciphertext
  const finalCiphertext = encrypted + ':' + authTag;

  const { data, error } = await supabase.from('pos_vault_entries').insert([{
    label,
    category,
    encrypted_value: finalCiphertext,
    iv: iv.toString('hex')
  }]).select('id, label, category, created_at').single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Reveal entry (requires token)
router.get('/entries/:id/reveal', async (req, res) => {
  const token = req.headers['x-vault-token'] as string;
  const aesKey = getValidSessionKey(token);
  if (!aesKey) return res.status(401).json({ error: 'Vault locked or session expired' });

  const { id } = req.params;
  const { data, error } = await supabase.from('pos_vault_entries').select('*').eq('id', id).single();
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
    console.error('Decryption failed:', err);
    res.status(500).json({ error: 'Decryption failed' });
  }
});

// Reset Vault
router.delete('/reset', async (req, res) => {
  // Truncate both tables
  await supabase.from('pos_vault_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('pos_vault_security').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // Also wipe all sessions
  vaultSessions.clear();
  res.json({ success: true });
});

export default router;
