CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT DEFAULT 'Single',
  duration INTEGER DEFAULT 0,
  cover_key TEXT,
  audio_key TEXT NOT NULL,
  source_url TEXT,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT DEFAULT 'audio/mpeg',
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_songs_created ON songs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_favorite ON songs(is_favorite);
