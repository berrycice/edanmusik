import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { getAllSongs, insertSong, SongRecord } from '../database/database.js';
import { uploadToR2 } from './r2.service.js';

export async function seedInitialSongsIfEmpty(): Promise<void> {
  const existing = await getAllSongs();
  if (existing.length > 0) {
    return;
  }

  console.log('Seeding initial demo tracks for MUSIK...');

  const sampleTracks = [
    {
      id: 'demo-song-1',
      title: 'Matahari Pagi',
      artist: 'Sora & Friends',
      album: 'Lofi Nusantara',
      duration: 165,
      frequency: 440,
      coverSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F43F5E"/><stop offset="100%" stop-color="#FB923C"/></linearGradient></defs><rect width="500" height="500" fill="url(#g1)"/><circle cx="250" cy="220" r="110" fill="#FFF" opacity="0.9"/><path d="M120 420 Q250 320 380 420 Z" fill="#FFF" opacity="0.4"/><text x="250" y="380" font-family="sans-serif" font-weight="bold" font-size="28" fill="#FFF" text-anchor="middle">Matahari Pagi</text></svg>`,
    },
    {
      id: 'demo-song-2',
      title: 'Bintang Malam',
      artist: 'Nusantara Chill',
      album: 'Sentuhan Angin',
      duration: 195,
      frequency: 523.25,
      coverSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E90FF"/><stop offset="100%" stop-color="#6366F1"/></linearGradient></defs><rect width="500" height="500" fill="url(#g2)"/><circle cx="250" cy="200" r="80" fill="#38BDF8" opacity="0.8"/><polygon points="250,90 260,115 285,120 265,135 270,160 250,145 230,160 235,135 215,120 240,115" fill="#FFF"/><text x="250" y="380" font-family="sans-serif" font-weight="bold" font-size="28" fill="#FFF" text-anchor="middle">Bintang Malam</text></svg>`,
    },
    {
      id: 'demo-song-3',
      title: 'Harmoni Senja',
      artist: 'Aura Soundscape',
      album: 'Akustik Jiwa',
      duration: 140,
      frequency: 329.63,
      coverSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#EC4899"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="500" height="500" fill="url(#g3)"/><circle cx="250" cy="250" r="130" stroke="#FFF" stroke-width="4" fill="none" opacity="0.6"/><path d="M220 180 L290 250 L220 320 Z" fill="#FFF" opacity="0.9"/><text x="250" y="400" font-family="sans-serif" font-weight="bold" font-size="28" fill="#FFF" text-anchor="middle">Harmoni Senja</text></svg>`,
    },
  ];

  for (const track of sampleTracks) {
    try {
      const tempAudio = path.join('/tmp', `${track.id}.mp3`);
      const tempCover = path.join('/tmp', `${track.id}.jpg`);

      // Generate a pleasant ambient tone audio track with soft attack/decay
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('ffmpeg', [
          '-y',
          '-f', 'lavfi',
          '-i', `sine=frequency=${track.frequency}:duration=15`,
          '-af', 'volume=0.2,afade=t=in:ss=0:d=1,afade=t=out:st=14:d=1',
          '-f', 'mp3',
          tempAudio,
        ]);
        proc.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg exit ${c}`))));
        proc.on('error', reject);
      });

      // Generate cover image
      fs.writeFileSync(path.join('/tmp', `${track.id}.svg`), track.coverSvg);
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('ffmpeg', [
          '-y',
          '-i', path.join('/tmp', `${track.id}.svg`),
          '-s', '400x400',
          tempCover,
        ]);
        proc.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg cover exit ${c}`))));
        proc.on('error', reject);
      });

      const audioKey = `music/${track.id}.mp3`;
      const coverKey = `covers/${track.id}.jpg`;

      await uploadToR2(audioKey, tempAudio, 'audio/mpeg');
      await uploadToR2(coverKey, tempCover, 'image/jpeg');

      const song: SongRecord = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        cover_key: coverKey,
        audio_key: audioKey,
        source_url: 'https://archive.org/details/demo_lofi',
        file_size: fs.existsSync(tempAudio) ? fs.statSync(tempAudio).size : 120000,
        mime_type: 'audio/mpeg',
        is_favorite: track.id === 'demo-song-1' ? 1 : 0,
        created_at: new Date(Date.now() - (track.duration * 1000)).toISOString(),
        updated_at: new Date().toISOString(),
      };

      await insertSong(song);

      // Clean up temp
      if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);
      if (fs.existsSync(tempCover)) fs.unlinkSync(tempCover);
      if (fs.existsSync(path.join('/tmp', `${track.id}.svg`))) fs.unlinkSync(path.join('/tmp', `${track.id}.svg`));
    } catch (e) {
      console.warn('Failed to seed demo track', track.title, e);
    }
  }

  console.log('Seed completed successfully');
}
