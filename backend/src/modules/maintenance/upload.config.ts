import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'maintenance');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const uploadMaintenanceAttachment = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Unsupported file type — only JPEG, PNG, WebP, and PDF are allowed'));
    }
    cb(null, true);
  },
});

// NOTE: local disk storage means uploaded files live on whatever Railway
// instance handles the request. Railway's filesystem is ephemeral on
// redeploys — fine for now per the spec's "local storage now, cloud later"
// requirement, but swap this module for an S3/Supabase Storage adapter
// before relying on attachments surviving a redeploy in production.
