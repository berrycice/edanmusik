import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  listSongs,
  getSong,
  streamSong,
  importSong,
  toggleFavorite,
  removeSong,
} from '../controllers/music.controller.js';

const router = Router();

// Rate limiting for media processing
const importLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // limit each IP to 15 requests per minute
  message: { error: 'Terlalu banyak permintaan import musik, silakan coba sesaat lagi' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', listSongs);
router.get('/:id', getSong);
router.get('/:id/stream', streamSong);
router.post('/import', importLimiter, importSong);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', removeSong);

export default router;
