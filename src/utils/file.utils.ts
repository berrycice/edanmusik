import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env.js';

const TEMP_DIR = path.resolve(process.cwd(), 'temp');

export function ensureTempDir(): string {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  return TEMP_DIR;
}

export function generateTempFilePath(extension: string): string {
  ensureTempDir();
  const uuid = crypto.randomUUID();
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return path.join(TEMP_DIR, `${uuid}${ext}`);
}

export function cleanupTempFile(filePath: string): void {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`Failed to delete temp file ${filePath}:`, err);
  }
}

export function cleanupStaleTempFiles(): void {
  try {
    if (!fs.existsSync(TEMP_DIR)) return;
    const now = Date.now();
    const maxAgeMs = (config.tempFileMaxAgeMinutes || 30) * 60 * 1000;
    const files = fs.readdirSync(TEMP_DIR);
    for (const file of files) {
      const fullPath = path.join(TEMP_DIR, file);
      try {
        const stat = fs.statSync(fullPath);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Ignore single file stat errors
      }
    }
  } catch (err) {
    console.warn('Error during stale temp file cleanup:', err);
  }
}
