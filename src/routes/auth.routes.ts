import { Router, Request, Response } from 'express';
import {
  verifyOwnerCredentials,
  createOwnerSession,
  invalidateOwnerSession,
  isOwnerSessionValid,
  getOwnerUser,
} from '../services/auth.service.js';

const router = Router();

// Helper to extract bearer token or x-owner-token
export function extractOwnerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-owner-token'];
  if (typeof customHeader === 'string') {
    return customHeader.trim();
  }
  return undefined;
}

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username dan password wajib diisi' });
    return;
  }

  const isValid = verifyOwnerCredentials(username, password);
  if (!isValid) {
    res.status(401).json({ error: 'Username atau password salah' });
    return;
  }

  const token = createOwnerSession();
  res.json({
    success: true,
    message: 'Login berhasil sebagai Owner',
    token,
    user: getOwnerUser(),
  });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  const token = extractOwnerToken(req);
  const isOwner = isOwnerSessionValid(token);

  if (isOwner) {
    res.json({
      authenticated: true,
      role: 'owner',
      user: getOwnerUser(),
    });
  } else {
    res.json({
      authenticated: false,
      role: 'guest',
      user: {
        username: 'guest',
        role: 'guest',
        displayName: 'Tamu',
      },
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const token = extractOwnerToken(req);
  if (token) {
    invalidateOwnerSession(token);
  }
  res.json({ success: true, message: 'Berhasil logout' });
});

export default router;
