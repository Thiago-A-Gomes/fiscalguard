import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.mjs';

mkdirSync(dirname(config.databasePath), { recursive: true });
const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL CHECK(length(event_type) <= 80),
    document_count INTEGER NOT NULL CHECK(document_count >= 0 AND document_count <= 100),
    finding_count INTEGER NOT NULL CHECK(finding_count >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;
`);

const insertAudit = db.prepare('INSERT INTO audit_events (event_type, document_count, finding_count) VALUES (?, ?, ?)');
const listAudit = db.prepare('SELECT id, event_type AS eventType, document_count AS documentCount, finding_count AS findingCount, created_at AS createdAt FROM audit_events ORDER BY id DESC LIMIT ?');

export function recordAuditEvent(event) {
  return insertAudit.run(event.eventType, event.documentCount, event.findingCount);
}

export function getAuditEvents(limit = 50) {
  return listAudit.all(Math.min(Math.max(Number(limit) || 50, 1), 100));
}
