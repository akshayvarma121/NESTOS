import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  sharedSpaceIds?: string[];
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = { id: user.id };

  // Determine Shared Space (Couples Mode)
  // Fetch all partner connections where this user is either side
  const { data: connections } = await supabase
    .from('pos_partner_connections')
    .select('*')
    .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`);

  const spaceIds = [user.id]; // always include self
  if (connections) {
    for (const conn of connections) {
      spaceIds.push(conn.user_id === user.id ? conn.partner_id : conn.user_id);
    }
  }

  // De-duplicate just in case
  req.sharedSpaceIds = [...new Set(spaceIds)];

  next();
};
