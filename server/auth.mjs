import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { config } from './config.mjs';
import { createSessionRecord, deleteSessionRecord, findSession, purgeExpiredSessions } from './db.mjs';

export const SESSION_COOKIE = 'fiscalguard_session';

export function verifyPassword(password, encodedHash) {
  try {
    const [algorithm, salt, expectedHex] = String(encodedHash).split('$');
    if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

export function issueSession(user) {
  purgeExpiredSessions();
  const token = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + config.sessionTtlHours * 3_600_000).toISOString();
  createSessionRecord(hash(token), user.id, csrfToken, expiresAt.replace('T', ' ').replace('Z', ''));
  return { token, csrfToken, expiresAt };
}

export function authenticate(request) {
  const token = parseCookies(request.headers.cookie ?? '')[SESSION_COOKIE];
  if (!token) return null;
  return findSession(hash(token)) ?? null;
}

export function revokeSession(request) {
  const token = parseCookies(request.headers.cookie ?? '')[SESSION_COOKIE];
  if (token) deleteSessionRecord(hash(token));
}

export function verifyCsrf(request, session) {
  const supplied = String(request.headers['x-csrf-token'] ?? '');
  return Boolean(supplied && safeEqual(supplied, session.csrfToken));
}

export function sessionCookie(token) {
  const secure = config.isProduction ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${config.sessionTtlHours * 3600}${secure}`;
}

export function expiredSessionCookie() {
  const secure = config.isProduction ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

function hash(value) { return createHash('sha256').update(value).digest('hex'); }
function safeEqual(left, right) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
function parseCookies(header) { return Object.fromEntries(header.split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, value]) => key && value)); }
