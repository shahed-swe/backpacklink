import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Request } from 'express';
import { env } from '../env.js';

export const UPLOAD_DIR = path.resolve(env.UPLOAD_DIR);

export function ensureUploadDir(): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 8);
    cb(null, `${crypto.randomUUID()}${ext || '.img'}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (png, jpg, webp, gif, svg) are allowed'));
  },
});

// Absolute URL for a stored upload. Prefers PUBLIC_API_URL; else derives from
// the request (https for any non-localhost host — nginx forwards Host/Proto).
export function publicUploadUrl(req: Request, filename: string): string {
  if (env.PUBLIC_API_URL) return `${env.PUBLIC_API_URL.replace(/\/$/, '')}/uploads/${filename}`;
  const host = req.get('host') || 'localhost:4000';
  const proto = /^(localhost|127\.)/.test(host) ? 'http' : 'https';
  return `${proto}://${host}/uploads/${filename}`;
}
