import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads/menu-imports');

export const MENU_IMPORT_LIMITS = {
  maxFileSizeBytes: 15 * 1024 * 1024,
  maxFiles: 20,
  maxPdfPages: 30,
  allowedMimeTypes: new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]),
  allowedExtensions: new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']),
} as const;

export function importDir(establishmentId: string, importId: string): string {
  return path.join(UPLOAD_ROOT, establishmentId, importId);
}

export async function ensureImportDir(establishmentId: string, importId: string): Promise<string> {
  const dir = importDir(establishmentId, importId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function removeImportDir(establishmentId: string, importId: string): Promise<void> {
  const dir = importDir(establishmentId, importId);
  await fs.rm(dir, { recursive: true, force: true });
}

export function isPathInsideRoot(absolutePath: string): boolean {
  const resolved = path.resolve(absolutePath);
  const root = path.resolve(UPLOAD_ROOT);
  return resolved.startsWith(root + path.sep) || resolved === root;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}
