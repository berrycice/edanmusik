import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { config, hasR2Config } from '../config/env.js';

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!hasR2Config()) {
    return null;
  }
  if (!s3ClientInstance) {
    const endpoint = config.r2.endpoint || `https://${config.r2.accountId}.r2.cloudflarestorage.com`;
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    });
  }
  return s3ClientInstance;
}

const LOCAL_MEDIA_DIR = path.resolve(process.cwd(), 'data', 'media');

function ensureLocalDirs(): void {
  const musicDir = path.join(LOCAL_MEDIA_DIR, 'music');
  const coversDir = path.join(LOCAL_MEDIA_DIR, 'covers');
  if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });
  if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
}

export async function uploadToR2(
  key: string,
  filePathOrBuffer: string | Buffer,
  contentType: string
): Promise<{ url: string; key: string }> {
  const s3 = getS3Client();

  if (s3) {
    try {
      let body: Buffer;
      if (typeof filePathOrBuffer === 'string') {
        body = fs.readFileSync(filePathOrBuffer);
      } else {
        body = filePathOrBuffer;
      }

      console.log(`[R2 Storage] Mengunggah ${key} (${(body.length / 1024).toFixed(1)} KB) ke Cloudflare R2 (Bucket: ${config.r2.bucketName})...`);

      const command = new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await s3.send(command);
      console.log(`[R2 Storage] Berhasil tersimpan di Cloudflare R2: ${key}`);

      // Simpan juga salinan cadangan lokal
      try {
        ensureLocalDirs();
        const destPath = path.join(LOCAL_MEDIA_DIR, key);
        const parentDir = path.dirname(destPath);
        if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
        if (typeof filePathOrBuffer === 'string') {
          fs.copyFileSync(filePathOrBuffer, destPath);
        } else {
          fs.writeFileSync(destPath, body);
        }
      } catch {
        // Non-blocking local cache copy
      }

      // If public base URL is configured, return direct URL, else return key
      const publicUrl = config.r2.publicBaseUrl
        ? `${config.r2.publicBaseUrl.replace(/\/$/, '')}/${key}`
        : `/api/media/${key}`;

      return { url: publicUrl, key };
    } catch (r2Error: any) {
      console.error(`[R2 Storage Warning] Gagal mengunggah ke Cloudflare R2 (${r2Error.message}). Menggunakan Local Storage fallback.`);
    }
  }

  // Local fallback jika R2 belum dikonfigurasi di .env
  console.log(`[Local Storage] Menyimpan ${key} ke media lokal (data/media/)...`);
  ensureLocalDirs();
  const destPath = path.join(LOCAL_MEDIA_DIR, key);
  const parentDir = path.dirname(destPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if (typeof filePathOrBuffer === 'string') {
    fs.copyFileSync(filePathOrBuffer, destPath);
  } else {
    fs.writeFileSync(destPath, filePathOrBuffer);
  }

  return {
    url: `/api/media/${key}`,
    key,
  };
}

export async function getAudioStreamUrl(audioKey: string): Promise<string> {
  const s3 = getS3Client();

  if (s3) {
    try {
      const command = new GetObjectCommand({
        Bucket: config.r2.bucketName,
        Key: audioKey,
      });
      // 3600 seconds expiration as specified in PRD Section 22
      return await getSignedUrl(s3, command, { expiresIn: 3600 });
    } catch (e) {
      console.warn(`[R2 Signed URL] Gagal membuat presigned URL untuk ${audioKey}, menggunakan local fallback stream.`);
    }
  }

  // Local fallback stream route
  return `/api/media/${audioKey}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  if (!key) return;

  const s3 = getS3Client();
  if (s3) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.r2.bucketName,
        Key: key,
      });
      await s3.send(command);
      console.log(`[R2 Storage] Berhasil menghapus ${key} dari Cloudflare R2`);
    } catch (e) {
      console.warn(`Failed to delete key ${key} from R2:`, e);
    }
  }

  try {
    const localFile = path.join(LOCAL_MEDIA_DIR, key);
    if (fs.existsSync(localFile)) {
      fs.unlinkSync(localFile);
    }
  } catch (e) {
    console.warn(`Failed to delete local file for ${key}:`, e);
  }
}

export function getLocalMediaPath(key: string): string | null {
  const localFile = path.join(LOCAL_MEDIA_DIR, key);
  if (fs.existsSync(localFile)) {
    return localFile;
  }
  return null;
}
