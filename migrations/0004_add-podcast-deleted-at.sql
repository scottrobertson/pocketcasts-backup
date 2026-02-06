-- Migration number: 0004 	 2026-02-06T00:00:00.000Z
ALTER TABLE podcasts ADD COLUMN deleted_at TEXT;
