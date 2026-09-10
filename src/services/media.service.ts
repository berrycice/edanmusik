import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateTempFilePath, cleanupTempFile } from '../utils/file.utils.js';
import { extractMetadata, extractCoverArt } from './metadata.service.js';
import { uploadToR2 } from './r2.service.js';
import { insertSong, SongRecord } from '../database/database.js';

export interface ProcessMediaOptions {
  sourceUrl?: string;
  buffer?: Buffer;
  originalFilename?: string;
  customTitle?: string;
  customArtist?: string;
  customAlbum?: string;
  coverUrl?: string;
  onProgress?: (stage: string, percent: number) => void;
}

export function isYouTubeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be' ||
      host.endsWith('.youtu.be')
    );
  } catch {
    return false;
  }
}

function getYtDlpCommand(): string {
  const binLocalWin = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
  if (fs.existsSync(binLocalWin)) return binLocalWin;

  const binLocal = path.join(process.cwd(), 'bin', 'yt-dlp');
  if (fs.existsSync(binLocal)) return binLocal;

  // Fallback to global yt-dlp installed in system PATH
  return 'yt-dlp';
}

async function extractYouTubeAudio(
  youtubeUrl: string,
  outputPath: string
): Promise<{ title?: string; artist?: string; thumbnail?: string }> {
  const ytdlpCmd = getYtDlpCommand();

  return new Promise((resolve, reject) => {
    // Attempt yt-dlp extraction with timeout and format fallback
    const args = [
      '--no-warnings',
      '--no-playlist',
      '--socket-timeout', '15',
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--print-json',
      '-o', outputPath,
      youtubeUrl,
    ];

    const proc = spawn(ytdlpCmd, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (c) => (stdout += c.toString()));
    proc.stderr.on('data', (c) => (stderr += c.toString()));

    proc.on('close', (code) => {
      // Check if file was created (yt-dlp might append .mp3 if -x --audio-format mp3 is used)
      let finalPath = outputPath;
      if (!fs.existsSync(finalPath) && fs.existsSync(`${outputPath}.mp3`)) {
        fs.renameSync(`${outputPath}.mp3`, finalPath);
      }

      if (code === 0 && fs.existsSync(finalPath)) {
        try {
          const meta = JSON.parse(stdout);
          resolve({
            title: meta.title,
            artist: meta.uploader || meta.channel || meta.artist,
            thumbnail: meta.thumbnail,
          });
        } catch {
          resolve({});
        }
      } else {
        if (
          stderr.includes('Sign in to confirm you’re not a bot') ||
          stderr.includes('bot') ||
          stderr.includes('HTTP Error 429')
        ) {
          reject(
            new Error(
              'YouTube membatasi unduhan otomatis dari server cloud dengan verifikasi bot (Sign in to confirm you’re not a bot). Silakan gunakan fitur Upload File Audio (.mp3) atau gunakan link direct audio/podcast.'
            )
          );
        } else if (stderr.includes('Video unavailable') || stderr.includes('Private video')) {
          reject(new Error('Video YouTube tidak tersedia atau bersifat privat.'));
        } else {
          reject(
            new Error(
              `Gagal memproses link YouTube: ${stderr.slice(-250).trim() || 'Format tidak didukung'}`
            )
          );
        }
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Gagal menjalankan pemroses video: ${err.message}`));
    });
  });
}

export async function processAndImportMedia(options: ProcessMediaOptions): Promise<SongRecord> {
  const tempFilesToClean: string[] = [];
  const songId = crypto.randomUUID();

  try {
    // 1. Preparing
    options.onProgress?.('Preparing...', 15);
    const inputExt = options.originalFilename ? path.extname(options.originalFilename) : '.tmp';
    const tempInputPath = generateTempFilePath(inputExt || '.tmp');
    tempFilesToClean.push(tempInputPath);

    let extractedCoverFromYt: string | undefined;

    if (options.buffer) {
      fs.writeFileSync(tempInputPath, options.buffer);
    } else if (options.sourceUrl) {
      if (isYouTubeUrl(options.sourceUrl)) {
        options.onProgress?.('Mengekstrak audio YouTube...', 25);
        const ytMeta = await extractYouTubeAudio(options.sourceUrl, tempInputPath);
        if (ytMeta.title && !options.customTitle) {
          options.customTitle = ytMeta.title;
        }
        if (ytMeta.artist && !options.customArtist) {
          options.customArtist = ytMeta.artist;
        }
        if (ytMeta.thumbnail) {
          extractedCoverFromYt = ytMeta.thumbnail;
        }
      } else {
        options.onProgress?.('Downloading media...', 25);
        // Fetch direct media URL
        const response = await fetch(options.sourceUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MUSIK/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`Gagal mengunduh media dari URL: status ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(tempInputPath, Buffer.from(arrayBuffer));
      }
    } else {
      throw new Error('sourceUrl atau file audio buffer diperlukan');
    }

    // 2. Processing & Metadata Extraction
    options.onProgress?.('Processing metadata...', 45);
    const extracted = await extractMetadata(tempInputPath);

    const title = (options.customTitle && options.customTitle.trim()) || extracted.title || 'Untitled Track';
    const artist = (options.customArtist && options.customArtist.trim()) || extracted.artist || 'Unknown Artist';
    const album = (options.customAlbum && options.customAlbum.trim()) || extracted.album || 'Single';

    // 3. Converting to MP3 via ffmpeg
    options.onProgress?.('Converting to MP3...', 65);
    const tempMp3Path = generateTempFilePath('.mp3');
    tempFilesToClean.push(tempMp3Path);

    await convertToMp3(tempInputPath, tempMp3Path);

    // Re-verify duration with converted file
    const mp3Stats = fs.statSync(tempMp3Path);
    const mp3Meta = await extractMetadata(tempMp3Path);
    const duration = mp3Meta.duration || extracted.duration || 180;

    // Check cover art extraction
    options.onProgress?.('Processing cover art...', 78);
    const tempCoverPath = generateTempFilePath('.jpg');
    tempFilesToClean.push(tempCoverPath);

    let coverKey = '';
    const hasCover = await extractCoverArt(tempInputPath, tempCoverPath);

    // 4. Uploading to R2
    options.onProgress?.('Uploading to R2...', 88);
    const audioKey = `music/${songId}.mp3`;
    await uploadToR2(audioKey, tempMp3Path, 'audio/mpeg');

    const targetCoverUrl = options.coverUrl || extractedCoverFromYt;

    if (hasCover) {
      coverKey = `covers/${songId}.jpg`;
      await uploadToR2(coverKey, tempCoverPath, 'image/jpeg');
    } else if (targetCoverUrl) {
      // If external coverUrl provided (or YouTube thumbnail), download and store in R2
      try {
        const coverRes = await fetch(targetCoverUrl);
        if (coverRes.ok) {
          const coverBuf = Buffer.from(await coverRes.arrayBuffer());
          coverKey = `covers/${songId}.jpg`;
          await uploadToR2(coverKey, coverBuf, 'image/jpeg');
        }
      } catch (e) {
        console.warn('Failed to fetch cover image:', e);
      }
    }

    // 5. Saving to SQLite
    options.onProgress?.('Saving metadata...', 95);
    const songRecord: SongRecord = {
      id: songId,
      title,
      artist,
      album,
      duration,
      cover_key: coverKey,
      audio_key: audioKey,
      source_url: options.sourceUrl || options.originalFilename || '',
      file_size: mp3Stats.size,
      mime_type: 'audio/mpeg',
      is_favorite: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await insertSong(songRecord);
    options.onProgress?.('Complete', 100);

    return songRecord;
  } finally {
    // 8. Cleanup temporary files
    for (const tempFile of tempFilesToClean) {
      cleanupTempFile(tempFile);
      if (fs.existsSync(`${tempFile}.mp3`)) {
        cleanupTempFile(`${tempFile}.mp3`);
      }
    }
  }
}

function convertToMp3(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-vn',
      '-ar', '44100',
      '-ac', '2',
      '-b:a', '192k',
      '-f', 'mp3',
      outputPath,
    ];

    const proc = spawn('ffmpeg', args);
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve();
      } else {
        reject(new Error(`Konversi audio ffmpeg gagal (code ${code}): ${stderr.slice(-300)}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Gagal menjalankan ffmpeg: ${err.message}`));
    });
  });
}
