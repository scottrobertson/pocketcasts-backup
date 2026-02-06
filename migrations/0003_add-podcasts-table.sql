-- Migration number: 0003 	 2026-02-06T00:00:00.000Z
CREATE TABLE IF NOT EXISTS podcasts (
    uuid TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    url TEXT,
    slug TEXT,
    date_added TEXT,
    folder_uuid TEXT,
    sort_position INTEGER,
    is_private INTEGER DEFAULT 0,
    auto_start_from INTEGER DEFAULT 0,
    auto_skip_last INTEGER DEFAULT 0,
    episodes_sort_order INTEGER,
    last_episode_uuid TEXT,
    last_episode_published TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    raw_data TEXT
);

CREATE INDEX IF NOT EXISTS idx_podcasts_folder_uuid ON podcasts(folder_uuid);
CREATE INDEX IF NOT EXISTS idx_podcasts_date_added ON podcasts(date_added);
