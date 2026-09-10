import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

export interface SongRecord {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  cover_key: string;
  audio_key: string;
  source_url: string;
  file_size: number;
  mime_type: string;
  is_favorite: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

let db: SqlJsDatabase | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'musik.sqlite');

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.error('Failed to load existing SQLite database, creating new:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  const schemaPath = path.resolve(process.cwd(), 'src/database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.run(schemaSql);
  } else {
    db.run(`
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
    `);
  }

  saveDatabase();
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite file:', err);
  }
}

export async function getAllSongs(filter?: string, search?: string): Promise<SongRecord[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM songs';
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (filter === 'favorites') {
    whereClauses.push('is_favorite = 1');
  }

  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    whereClauses.push('(LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(album) LIKE ?)');
    params.push(s, s, s);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const stmt = database.prepare(query);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const results: SongRecord[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as unknown as SongRecord;
    results.push({
      ...row,
      duration: Number(row.duration) || 0,
      file_size: Number(row.file_size) || 0,
      is_favorite: Number(row.is_favorite) || 0,
    });
  }
  stmt.free();
  return results;
}

export async function getSongById(id: string): Promise<SongRecord | null> {
  const database = await getDatabase();
  const stmt = database.prepare('SELECT * FROM songs WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as SongRecord;
    stmt.free();
    return {
      ...row,
      duration: Number(row.duration) || 0,
      file_size: Number(row.file_size) || 0,
      is_favorite: Number(row.is_favorite) || 0,
    };
  }
  stmt.free();
  return null;
}

export async function insertSong(song: SongRecord): Promise<SongRecord> {
  const database = await getDatabase();
  const sql = `
    INSERT INTO songs (
      id, title, artist, album, duration, cover_key,
      audio_key, source_url, file_size, mime_type,
      is_favorite, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  database.run(sql, [
    song.id,
    song.title,
    song.artist,
    song.album || 'Single',
    song.duration || 0,
    song.cover_key || '',
    song.audio_key,
    song.source_url || '',
    song.file_size || 0,
    song.mime_type || 'audio/mpeg',
    song.is_favorite ? 1 : 0,
    song.created_at || new Date().toISOString(),
    song.updated_at || new Date().toISOString(),
  ]);

  saveDatabase();
  return song;
}

export async function updateFavorite(id: string, isFavorite: boolean): Promise<boolean> {
  const database = await getDatabase();
  database.run(
    'UPDATE songs SET is_favorite = ?, updated_at = ? WHERE id = ?',
    [isFavorite ? 1 : 0, new Date().toISOString(), id]
  );
  saveDatabase();
  return true;
}

export async function deleteSong(id: string): Promise<boolean> {
  const database = await getDatabase();
  database.run('DELETE FROM songs WHERE id = ?', [id]);
  saveDatabase();
  return true;
}
