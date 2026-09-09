import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.mjs';

mkdirSync(dirname(config.databasePath), { recursive: true });
const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'analyst')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf_token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;
  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    event_type TEXT NOT NULL CHECK(length(event_type) <= 80),
    document_count INTEGER NOT NULL CHECK(document_count >= 0 AND document_count <= 100),
    finding_count INTEGER NOT NULL CHECK(finding_count >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;
`);

const columns = db.prepare('PRAGMA table_info(audit_events)').all();
if (!columns.some((column) => column.name === 'user_id')) db.exec('ALTER TABLE audit_events ADD COLUMN user_id INTEGER REFERENCES users(id)');

const upsertAdmin = db.prepare(`INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin') ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, role='admin'`);
upsertAdmin.run(config.adminEmail, config.adminPasswordHash);

const findUserStatement = db.prepare('SELECT id, email, password_hash AS passwordHash, role FROM users WHERE email = ?');
const insertSession = db.prepare('INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)');
const selectSession = db.prepare(`SELECT s.token_hash AS tokenHash, s.csrf_token AS csrfToken, s.expires_at AS expiresAt, u.id AS userId, u.email, u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > CURRENT_TIMESTAMP`);
const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash=?');
const purgeSessions = db.prepare('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
const insertAudit = db.prepare('INSERT INTO audit_events (user_id, event_type, document_count, finding_count) VALUES (?, ?, ?, ?)');
const listAudit = db.prepare('SELECT a.id, a.event_type AS eventType, a.document_count AS documentCount, a.finding_count AS findingCount, a.created_at AS createdAt, u.email AS actor FROM audit_events a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT ?');

export function findUserByEmail(email) { return findUserStatement.get(email); }
export function createSessionRecord(tokenHash, userId, csrfHash, expiresAt) { return insertSession.run(tokenHash, userId, csrfHash, expiresAt); }
export function findSession(tokenHash) { return selectSession.get(tokenHash); }
export function deleteSessionRecord(tokenHash) { return deleteSession.run(tokenHash); }
export function purgeExpiredSessions() { return purgeSessions.run(); }
export function recordAuditEvent(userId, event) { return insertAudit.run(userId, event.eventType, event.documentCount, event.findingCount); }
export function getAuditEvents(limit = 50) { return listAudit.all(Math.min(Math.max(Number(limit) || 50, 1), 100)); }
