CREATE TABLE spike_note (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
INSERT INTO spike_note (text) VALUES ('první');
