import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  getAllSongs,
  getSongById,
  updateFavorite,
  deleteSong,
  SongRecord,
} from '../database/database.js';
import { getAudioStreamUrl, deleteFromR2, getLocalMediaPath } from '../services/r2.service.js';
import { processAndImportMedia } from '../services/media.service.js';
import { isValidMediaUrl } from '../utils/validation.utils.js';
import { config } from '../config/env.js';
import { isOwnerSessionValid } from '../services/auth.service.js';
import { extractOwnerToken } from '../routes/auth.routes.js';

function getStreamUrlWithAuth(songId: string): string {
  const tokenParam = config.privateAppToken ? `?token=${encodeURIComponent(config.privateAppToken)}` : '';
  return `/api/music/${songId}/stream${tokenParam}`;
}

export async function listSongs(req: Request, res: Response): Promise<void> {
  try {
    const { q, filter } = req.query;
    const songs = await getAllSongs(
      filter ? String(filter) : undefined,
      q ? String(q) : undefined
    );

    // Format song items with resolved stream and cover endpoints
    const formatted = songs.map((s) => ({
      ...s,
      cover_url: s.cover_key ? `/api/media/${s.cover_key}` : '/assets/default-cover.svg',
      stream_url: getStreamUrlWithAuth(s.id),
    }));

    res.json({
      success: true,
      songs: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Gagal memuat daftar musik', details: error.message });
  }
}

export async function getSong(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const song = await getSongById(id);
    if (!song) {
      res.status(404).json({ error: 'Musik tidak ditemukan' });
      return;
    }

    res.json({
      success: true,
      song: {
        ...song,
        cover_url: song.cover_key ? `/api/media/${song.cover_key}` : '/assets/default-cover.svg',
        stream_url: getStreamUrlWithAuth(song.id),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengambil detail musik', details: error.message });
  }
}

export async function streamSong(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const song = await getSongById(id);
    if (!song) {
      res.status(404).json({ error: 'Musik tidak ditemukan' });
      return;
    }

    const streamUrl = await getAudioStreamUrl(song.audio_key);

    // If client requested json
    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      res.json({ streamUrl });
      return;
    }

    // If it's an external signed R2 URL, redirect directly
    if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
      res.redirect(streamUrl);
      return;
    }

    // Otherwise serve local file with HTTP Range support
    const localFilePath = getLocalMediaPath(song.audio_key);
    if (localFilePath && fs.existsSync(localFilePath)) {
      serveAudioWithRange(req, res, localFilePath, song.mime_type || 'audio/mpeg');
    } else {
      res.status(404).json({ error: 'Berkas audio tidak ditemukan di penyimpanan' });
    }
  } catch (error: any) {
    console.error('Error streaming song:', error);
    res.status(500).json({ error: 'Gagal memutar audio', details: error.message });
  }
}

export async function importSong(req: Request, res: Response): Promise<void> {
  try {
    const { sourceUrl, fileBase64, filename, title, artist, album, coverUrl } = req.body;

    if (!sourceUrl && !fileBase64) {
      res.status(400).json({ error: 'sourceUrl atau fileBase64 wajib diisi' });
      return;
    }

    if (sourceUrl) {
      if (typeof sourceUrl !== 'string' || !isValidMediaUrl(sourceUrl)) {
        res.status(400).json({ error: 'Format link media tidak valid atau tidak diizinkan' });
        return;
      }
    }

    let buffer: Buffer | undefined;
    if (fileBase64) {
      buffer = Buffer.from(fileBase64, 'base64');
    }

    const imported = await processAndImportMedia({
      sourceUrl: sourceUrl ? sourceUrl.trim() : undefined,
      buffer,
      originalFilename: filename || 'upload.mp3',
      customTitle: title,
      customArtist: artist,
      customAlbum: album,
      coverUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Musik berhasil ditambahkan',
      song: {
        ...imported,
        cover_url: imported.cover_key ? `/api/media/${imported.cover_key}` : '/assets/default-cover.svg',
        stream_url: getStreamUrlWithAuth(imported.id),
      },
    });
  } catch (error: any) {
    console.error('Error importing song:', error);
    res.status(500).json({ error: error.message || 'Gagal menambahkan musik' });
  }
}

export async function toggleFavorite(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const song = await getSongById(id);
    if (!song) {
      res.status(404).json({ error: 'Musik tidak ditemukan' });
      return;
    }

    let isFavorite: boolean;
    if (typeof req.body.is_favorite === 'boolean') {
      isFavorite = req.body.is_favorite;
    } else {
      isFavorite = song.is_favorite === 0;
    }

    await updateFavorite(id, isFavorite);
    res.json({
      success: true,
      id,
      is_favorite: isFavorite ? 1 : 0,
      message: isFavorite ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal memperbarui status favorit', details: error.message });
  }
}

export async function removeSong(req: Request, res: Response): Promise<void> {
  try {
    const token = extractOwnerToken(req);
    if (!isOwnerSessionValid(token)) {
      res.status(403).json({
        error: 'Akses ditolak: Hanya Owner (fajarkeren) yang berhak menghapus lagu dari library.',
      });
      return;
    }

    const { id } = req.params;
    const song = await getSongById(id);
    if (!song) {
      res.status(404).json({ error: 'Musik tidak ditemukan' });
      return;
    }

    // Delete files from R2/local storage
    await deleteFromR2(song.audio_key);
    if (song.cover_key) {
      await deleteFromR2(song.cover_key);
    }

    // Delete row from SQLite
    await deleteSong(id);

    res.json({
      success: true,
      message: 'Musik dihapus.',
      deletedId: id,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menghapus musik', details: error.message });
  }
}

export function serveLocalMedia(req: Request, res: Response): void {
  const mediaKey = (req.params as any)[0];
  if (!mediaKey) {
    res.status(400).send('Media key required');
    return;
  }

  // Prevent path traversal
  const safeKey = path.normalize(mediaKey).replace(/^(\.\.[\/\\])+/, '');
  const filePath = getLocalMediaPath(safeKey);

  if (!filePath || !fs.existsSync(filePath)) {
    // If it's a cover and doesn't exist, serve default cover
    if (safeKey.startsWith('covers/')) {
      res.redirect('/assets/default-cover.svg');
      return;
    }
    res.status(404).send('Media file not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                   ext === '.png' ? 'image/png' :
                   ext === '.svg' ? 'image/svg+xml' : 'audio/mpeg';

  if (mimeType.startsWith('audio/')) {
    serveAudioWithRange(req, res, filePath, mimeType);
  } else {
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  }
}

function serveAudioWithRange(req: Request, res: Response, filePath: string, contentType: string): void {
  const stat = fs.statSync(filePath);
  const total = stat.size;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', contentType);

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const partialStart = parts[0];
    const partialEnd = parts[1];

    const start = parseInt(partialStart, 10);
    const end = partialEnd ? parseInt(partialEnd, 10) : total - 1;
    const chunksize = (end - start) + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
    res.setHeader('Content-Length', chunksize);

    const fileStream = fs.createReadStream(filePath, { start, end });
    fileStream.pipe(res);
  } else {
    res.setHeader('Content-Length', total);
    fs.createReadStream(filePath).pipe(res);
  }
}
