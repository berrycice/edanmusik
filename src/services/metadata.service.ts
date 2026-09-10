import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ExtractedMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration: number; // in seconds
  format?: string;
  hasCoverArt?: boolean;
}

export async function extractMetadata(filePath: string): Promise<ExtractedMetadata> {
  return new Promise((resolve) => {
    // Run ffprobe to get format and stream metadata in JSON format
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    const proc = spawn('ffprobe', args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 || !stdout) {
        console.warn('ffprobe exited with code', code, stderr);
        // Fallback metadata based on filename
        const filename = path.basename(filePath, path.extname(filePath));
        return resolve({
          title: formatTitleFromFilename(filename),
          artist: 'Artis Tidak Diketahui',
          album: 'Single',
          duration: 0,
        });
      }

      try {
        const info = JSON.parse(stdout);
        const format = info.format || {};
        const tags = format.tags || {};
        const duration = Math.round(parseFloat(format.duration || '0'));

        // Check if there is an attached picture stream
        const hasCover = (info.streams || []).some(
          (s: any) => s.codec_name === 'mjpeg' || s.codec_name === 'png' || s.disposition?.attached_pic === 1
        );

        const filename = path.basename(filePath, path.extname(filePath));
        const parsedFilename = formatTitleFromFilename(filename);

        resolve({
          title: tags.title || tags.TITLE || parsedFilename,
          artist: tags.artist || tags.ARTIST || tags.album_artist || 'Unknown Artist',
          album: tags.album || tags.ALBUM || 'Single',
          duration: isNaN(duration) ? 0 : duration,
          format: format.format_name,
          hasCoverArt: hasCover,
        });
      } catch (err) {
        console.warn('Failed to parse ffprobe json output:', err);
        const filename = path.basename(filePath, path.extname(filePath));
        resolve({
          title: formatTitleFromFilename(filename),
          artist: 'Unknown Artist',
          album: 'Single',
          duration: 0,
        });
      }
    });

    proc.on('error', (err) => {
      console.warn('ffprobe execution error:', err);
      const filename = path.basename(filePath, path.extname(filePath));
      resolve({
        title: formatTitleFromFilename(filename),
        artist: 'Unknown Artist',
        album: 'Single',
        duration: 0,
      });
    });
  });
}

export async function extractCoverArt(audioFilePath: string, outputJpgPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Attempt to extract embedded artwork with ffmpeg
    const args = [
      '-y',
      '-i', audioFilePath,
      '-an',
      '-vcodec', 'copy',
      outputJpgPath,
    ];

    const proc = spawn('ffmpeg', args);
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputJpgPath) && fs.statSync(outputJpgPath).size > 100) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}

function formatTitleFromFilename(filename: string): string {
  // Strip UUID prefixes or numeric sequences if present
  let clean = filename.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_?/i, '');
  clean = clean.replace(/_/g, ' ').replace(/-/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
