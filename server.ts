import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { config, hasR2Config } from './src/config/env.js';
import healthRoutes from './src/routes/health.routes.js';
import musicRoutes from './src/routes/music.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import { serveLocalMedia } from './src/controllers/music.controller.js';
import { cleanupStaleTempFiles } from './src/utils/file.utils.js';
import { seedInitialSongsIfEmpty } from './src/services/seed.service.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Security middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cors());
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Session / Token endpoint for client bootstrapping
  app.get('/api/auth/session', (req, res) => {
    if (config.privateAppToken) {
      res.cookie('musik_token', config.privateAppToken, {
        path: '/',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    }
    res.json({
      authenticated: true,
      hasToken: Boolean(config.privateAppToken),
      token: config.privateAppToken || null,
    });
  });

  // PRIVATE_APP_TOKEN check middleware
  app.use((req, res, next) => {
    // If no token is configured, allow all
    if (!config.privateAppToken) {
      return next();
    }

    // Skip authentication for auth session endpoint, health check, media, and non-API requests
    if (
      !req.path.startsWith('/api/music') ||
      req.path === '/api/auth/session' ||
      req.path === '/api/health'
    ) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
    const cookieHeader = req.headers.cookie || '';
    const cookieToken = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('musik_token='))
      ?.split('=')[1];

    // 1. Direct token match via Bearer header, URL query param, or cookie
    if (
      bearerToken === config.privateAppToken ||
      queryToken === config.privateAppToken ||
      cookieToken === config.privateAppToken
    ) {
      return next();
    }

    // 2. Browser client verification: allow same-origin requests
    const host = req.get('host');
    const referer = req.get('referer');
    const origin = req.get('origin');
    const secFetchSite = req.headers['sec-fetch-site'];

    const isSameOrigin =
      secFetchSite === 'same-origin' ||
      (origin && host && origin.includes(host)) ||
      (referer && host && referer.includes(host));

    if (isSameOrigin) {
      return next();
    }

    res.status(401).json({ error: 'Unauthorized: Invalid or missing PRIVATE_APP_TOKEN' });
  });

  // API Routes (Mounted FIRST)
  app.get('/api/download-zip', (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'musik-project.zip');
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'musik-project.zip');
    } else {
      res.status(404).json({ error: 'File ZIP belum tersedia' });
    }
  });
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/music', musicRoutes);
  app.get('/api/media/*', serveLocalMedia);

  // Periodic cleanup of temp files every 15 minutes
  setInterval(() => {
    cleanupStaleTempFiles();
  }, 15 * 60 * 1000);

  // Seed initial demo songs in background
  seedInitialSongsIfEmpty().catch((err) => {
    console.warn('Initial seeding error:', err);
  });

  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MUSIK Server running on http://0.0.0.0:${PORT}`);
    if (hasR2Config()) {
      console.log(`[Storage] Cloudflare R2 AKTIF (Bucket: ${config.r2.bucketName})`);
    } else {
      console.log(`[Storage] Mode LOCAL STORAGE (data/media/) aktif karena kredensial R2 belum diisi di .env`);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start MUSIK server:', err);
  process.exit(1);
});
