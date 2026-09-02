import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadDotEnv(resolve(process.cwd(), '.env'));

export const config = {
  port: Number(process.env.SERVER_PORT ?? 3333),
  databasePath: resolve(process.cwd(), process.env.DATABASE_PATH ?? './data/fiscalguard.db'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://127.0.0.1:3000,http://localhost:3000').split(',').map((value) => value.trim()),
  isProduction: process.env.NODE_ENV === 'production',
};

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}
