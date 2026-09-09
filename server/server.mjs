import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { config } from './config.mjs';
import { findUserByEmail, getAuditEvents, recordAuditEvent } from './db.mjs';
import { authenticate, expiredSessionCookie, issueSession, revokeSession, sessionCookie, verifyCsrf, verifyPassword } from './auth.mjs';

const distPath = resolve(process.cwd(), 'dist');
const rateBuckets = new Map();
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

const server = http.createServer(async (request, response) => {
  try {
    setSecurityHeaders(response);
    if (!allowRequest(request)) return sendJson(response, 429, { message: 'Muitas requisições. Tente novamente em instantes.' });
    if (request.url?.startsWith('/api/')) {
      setCors(request, response);
      if (request.method === 'OPTIONS') return void response.writeHead(204).end();
      if (request.method === 'GET' && request.url === '/api/health') return sendJson(response, 200, { ok: true, service: 'fiscalguard-api' });

      if (request.method === 'POST' && request.url === '/api/auth/login') {
        if (!isTrustedOrigin(request)) return sendJson(response, 403, { message: 'Origem não autorizada.' });
        const body = await readJson(request);
        const user = findUserByEmail(String(body.email ?? '').trim().toLowerCase());
        if (!user || !verifyPassword(String(body.password ?? ''), user.passwordHash)) return sendJson(response, 401, { message: 'E-mail ou senha inválidos.' });
        const session = issueSession(user);
        response.setHeader('Set-Cookie', sessionCookie(session.token));
        return sendJson(response, 200, { user: { email: user.email, role: user.role }, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
      }

      const session = authenticate(request);
      if (!session) return sendJson(response, 401, { message: 'Autenticação necessária.' });

      if (request.method === 'GET' && request.url === '/api/auth/me') return sendJson(response, 200, { user: { email: session.email, role: session.role }, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
      if (request.method === 'POST' && request.url === '/api/auth/logout') {
        if (!verifyCsrf(request, session)) return sendJson(response, 403, { message: 'Token CSRF inválido.' });
        revokeSession(request); response.setHeader('Set-Cookie', expiredSessionCookie());
        return sendJson(response, 200, { ok: true });
      }
      if (request.method === 'GET' && request.url.startsWith('/api/audit')) return sendJson(response, 200, getAuditEvents(new URL(request.url, 'http://local').searchParams.get('limit')));
      if (request.method === 'POST' && request.url === '/api/audit') {
        if (!verifyCsrf(request, session)) return sendJson(response, 403, { message: 'Token CSRF inválido.' });
        const body = await readJson(request);
        if (body.eventType !== 'analysis_completed' || !Number.isInteger(body.documentCount) || !Number.isInteger(body.findingCount)) return sendJson(response, 400, { message: 'Evento inválido.' });
        recordAuditEvent(session.userId, body); return sendJson(response, 201, { ok: true });
      }
      return sendJson(response, 404, { message: 'Rota não encontrada.' });
    }
    serveStatic(request, response);
  } catch (error) {
    console.error('[FiscalGuard]', error instanceof Error ? error.message : 'erro interno');
    if (!response.headersSent) sendJson(response, 500, { message: 'Erro interno.' });
  }
});

server.listen(config.port, '0.0.0.0', () => console.log(`FiscalGuard backend ativo na porta ${config.port}`));

function setSecurityHeaders(response) { Object.entries(securityHeaders).forEach(([key, value]) => response.setHeader(key, value)); }
function setCors(request, response) { const origin = String(request.headers.origin ?? ''); if (config.allowedOrigins.includes(origin)) { response.setHeader('Access-Control-Allow-Origin', origin); response.setHeader('Access-Control-Allow-Credentials', 'true'); } response.setHeader('Vary', 'Origin'); response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); response.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-CSRF-Token'); }
function isTrustedOrigin(request) { const origin = String(request.headers.origin ?? ''); return !origin || config.allowedOrigins.includes(origin); }
function allowRequest(request) { const key = request.socket.remoteAddress ?? 'unknown'; const now = Date.now(); const bucket = rateBuckets.get(key) ?? { start: now, count: 0 }; if (now - bucket.start > 60_000) { bucket.start = now; bucket.count = 0; } bucket.count += 1; rateBuckets.set(key, bucket); return bucket.count <= 120; }
function sendJson(response, status, data) { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(data)); }
function readJson(request) { return new Promise((resolveBody, reject) => { let body = ''; request.on('data', (chunk) => { body += chunk; if (body.length > 16_384) { request.destroy(); reject(new Error('Payload muito grande.')); } }); request.on('end', () => { try { resolveBody(body ? JSON.parse(body) : {}); } catch { reject(new Error('JSON inválido.')); } }); request.on('error', reject); }); }
function serveStatic(request, response) { const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://local').pathname); const requested = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^([/\\])+/, ''); const filePath = resolve(distPath, requested); if (!filePath.startsWith(distPath)) return sendJson(response, 403, { message: 'Acesso negado.' }); const target = existsSync(filePath) && statSync(filePath).isFile() ? filePath : join(distPath, 'index.html'); const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }; response.writeHead(200, { 'Content-Type': mime[extname(target)] ?? 'application/octet-stream', 'Cache-Control': extname(target) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' }); createReadStream(target).pipe(response); }
