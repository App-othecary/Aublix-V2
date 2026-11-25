import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const TOKEN_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface StoredSavedBook {
  userId: string;
  bookId: string;
  savedAt: string;
  bookSnapshot: unknown;
}

interface StoredProgress {
  userId: string;
  bookId: string;
  chapterIndex: number;
  chapterTitle: string;
  positionSeconds: number;
  chapterDurationSeconds: number;
  totalElapsedSeconds: number;
  totalBookDurationSeconds: number;
  playbackSpeed: number;
  completed: boolean;
  lastListenedAt: string;
  bookSnapshot?: unknown;
}

interface LocalStore {
  users: StoredUser[];
  savedBooks: StoredSavedBook[];
  progress: StoredProgress[];
}

function ensureStore(): LocalStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const empty: LocalStore = { users: [], savedBooks: [], progress: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2), 'utf8');
    return empty;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      savedBooks: Array.isArray(parsed.savedBooks) ? parsed.savedBooks : [],
      progress: Array.isArray(parsed.progress) ? parsed.progress : [],
    };
  } catch {
    return { users: [], savedBooks: [], progress: [] };
  }
}

function saveStore(store: LocalStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function signToken(payload: { sub: string; email: string; displayName: string }): string {
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token: string): { sub: string; email: string; displayName: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as {
      sub?: string;
      email?: string;
      displayName?: string;
      exp?: number;
    };
    if (!parsed.sub || !parsed.email || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return {
      sub: parsed.sub,
      email: parsed.email,
      displayName: parsed.displayName || parsed.email.split('@')[0],
    };
  } catch {
    return null;
  }
}

interface AuthedRequest extends express.Request {
  authUser?: { id: string; email: string; displayName: string };
}

function requireAuth(
  req: AuthedRequest,
  res: express.Response,
  next: express.NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const claims = verifyToken(token);
  if (!claims) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  req.authUser = {
    id: claims.sub,
    email: claims.email,
    displayName: claims.displayName,
  };
  next();
}

// Simple in-memory cache for Internet Archive queries
const archiveCache = new Map<string, { expiresAt: number; data: unknown }>();
const CACHE_TTL_MS = 1000 * 60 * 15;

function parseSeconds(raw: string | number | undefined): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.round(raw);
  if (typeof raw !== 'string') return 0;
  const trimmed = raw.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Math.round(Number(trimmed));
  const parts = trimmed.split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + Math.round(parts[2]);
  if (parts.length === 2) return parts[0] * 60 + Math.round(parts[1]);
  return 0;
}

function cleanText(input: unknown, fallback = ''): string {
  if (Array.isArray(input)) return cleanText(input[0], fallback);
  if (typeof input !== 'string') return fallback;
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapSubjectToGenre(subjectRaw: string): string {
  const s = subjectRaw.toLowerCase();
  if (s.includes('mystery') || s.includes('horror') || s.includes('gothic') || s.includes('detective')) {
    return 'Mystery & Gothic';
  }
  if (s.includes('philosophy') || s.includes('ethics') || s.includes('stoic') || s.includes('religion')) {
    return 'Philosophy';
  }
  if (s.includes('science fiction') || s.includes('fantasy') || s.includes('adventure')) {
    return 'Sci-Fi & Fantasy';
  }
  return 'Classics';
}

async function fetchArchiveTracks(identifier: string) {
  if (!/^[a-zA-Z0-9_-]{3,120}$/.test(identifier)) {
    throw new Error('Invalid identifier');
  }
  const cacheKey = `tracks:${identifier}`;
  const cached = archiveCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}/files`, {
    signal: AbortSignal.timeout(4500),
  });
  if (!res.ok) {
    throw new Error(`Archive metadata failed (${res.status})`);
  }
  const json = (await res.json()) as {
    result?: Array<{
      name?: string;
      title?: string;
      track?: string;
      length?: string;
      format?: string;
    }>;
  };

  const files = json.result || [];
  let mp3Files = files.filter((f) => f.name && f.name.toLowerCase().endsWith('_64kb.mp3'));
  if (mp3Files.length === 0) {
    mp3Files = files.filter((f) => f.name && f.name.toLowerCase().endsWith('.mp3'));
  }

  const allHaveTrack = mp3Files.every((f) => Boolean(f.track && /^\d+/.test(f.track)));
  mp3Files.sort((a, b) => {
    if (allHaveTrack) {
      const ta = Number(a.track?.split('/')[0]) || 9999;
      const tb = Number(b.track?.split('/')[0]) || 9999;
      if (ta !== tb) return ta - tb;
    }
    return (a.name || '').localeCompare(b.name || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  const chapters = mp3Files.slice(0, 60).map((f, index) => {
    const rawName = f.name || `track_${index + 1}.mp3`;
    const fallbackTitle = rawName
      .replace(/_64kb\.mp3$/i, '')
      .replace(/\.mp3$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    return {
      id: `${identifier}-${index}`,
      index,
      title: cleanText(f.title) || fallbackTitle || `Chapter ${index + 1}`,
      durationSeconds: parseSeconds(f.length) || 600,
      audioUrl: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(rawName).replace(/%2F/g, '/')}`,
    };
  });

  archiveCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: chapters });
  return chapters;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Live Public Domain Search via Internet Archive (LibriVox collection)
  app.get('/api/catalog/search', async (req, res) => {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!rawQuery || rawQuery.length > 100) {
      res.json({ books: [] });
      return;
    }

    const cacheKey = `search:${rawQuery.toLowerCase()}`;
    const cached = archiveCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json({ books: cached.data });
      return;
    }

    try {
      const sanitized = rawQuery.replace(/[^a-zA-Z0-9\s'-]/g, ' ').trim();
      const iaQuery = `(${sanitized}) AND collection:librivoxaudio AND mediatype:audio AND language:(eng OR English)`;
      const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(iaQuery)}&fl[]=identifier,title,creator,description,subject,date,runtime&sort[]=downloads+desc&rows=8&output=json`;
      const response = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) {
        res.json({ books: [] });
        return;
      }

      const payload = (await response.json()) as {
        response?: {
          docs?: Array<{
            identifier?: string;
            title?: string;
            creator?: string | string[];
            description?: string | string[];
            subject?: string | string[];
            date?: string;
            runtime?: string;
          }>;
        };
      };

      const docs = (payload.response?.docs || []).slice(0, 6);
      const enriched = await Promise.all(
        docs.map(async (doc) => {
          const id = doc.identifier;
          if (!id || !/^[a-zA-Z0-9_-]{3,120}$/.test(id)) return null;
          try {
            const chapters = (await fetchArchiveTracks(id)) as Array<{
              durationSeconds: number;
            }>;
            if (!chapters || chapters.length === 0) return null;
            const totalDurationSeconds =
              chapters.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) ||
              parseSeconds(doc.runtime) ||
              3600;
            const subjectStr = Array.isArray(doc.subject)
              ? doc.subject.join(' ')
              : String(doc.subject || '');

            return {
              id,
              archiveId: id,
              title: cleanText(doc.title, 'Untitled Audiobook'),
              author: cleanText(doc.creator, 'Public Domain Author'),
              narrator: 'LibriVox Volunteer',
              edition: 'Internet Archive Public Domain',
              year: Number(String(doc.date || '').slice(0, 4)) || 1900,
              genre: mapSubjectToGenre(subjectStr),
              synopsis:
                cleanText(doc.description).slice(0, 320) ||
                'Free public-domain audiobook recording from the LibriVox and Internet Archive collection.',
              coverUrl: `https://archive.org/services/img/${encodeURIComponent(id)}`,
              coverAccent: '#8B6F3E',
              totalDurationSeconds,
              chapters,
              source: 'librivox',
            };
          } catch {
            return null;
          }
        })
      );

      const validBooks = enriched.filter(Boolean);
      archiveCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: validBooks });
      res.json({ books: validBooks });
    } catch {
      res.json({ books: [] });
    }
  });

  // Full chapter list loader for any Internet Archive audiobook
  app.get('/api/audiobooks/:identifier/tracks', async (req, res) => {
    const identifier = req.params.identifier;
    if (!/^[a-zA-Z0-9_-]{3,120}$/.test(identifier)) {
      res.status(400).json({ error: 'Invalid audiobook identifier' });
      return;
    }
    try {
      const chapters = await fetchArchiveTracks(identifier);
      res.json({ chapters });
    } catch {
      res.status(502).json({ error: 'Unable to load remote tracklist' });
    }
  });

  // Local Prototype Auth Routes (used automatically when Supabase env vars are unset)
  app.post('/api/auth/signup', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const displayName =
      typeof req.body?.displayName === 'string' && req.body.displayName.trim()
        ? req.body.displayName.trim().slice(0, 60)
        : email.split('@')[0];

    if (!email || !email.includes('@') || email.length > 160) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const store = ensureStore();
    if (store.users.some((u) => u.email === email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const user: StoredUser = {
      id: crypto.randomUUID(),
      email,
      displayName,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    saveStore(store);

    const token = signToken({ sub: user.id, email: user.email, displayName: user.displayName });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        authProvider: 'local',
      },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const store = ensureStore();
    const user = store.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({ sub: user.id, email: user.email, displayName: user.displayName });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        authProvider: 'local',
      },
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({
      user: {
        ...req.authUser,
        authProvider: 'local',
      },
    });
  });

  // Saved Library CRUD
  app.get('/api/library', requireAuth, (req: AuthedRequest, res) => {
    const store = ensureStore();
    const items = store.savedBooks
      .filter((item) => item.userId === req.authUser!.id)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    res.json({ savedBooks: items });
  });

  app.post('/api/library', requireAuth, (req: AuthedRequest, res) => {
    const bookId = typeof req.body?.bookId === 'string' ? req.body.bookId.trim() : '';
    const bookSnapshot = req.body?.bookSnapshot;
    if (!bookId || bookId.length > 140 || !bookSnapshot || typeof bookSnapshot !== 'object') {
      res.status(400).json({ error: 'Invalid book payload.' });
      return;
    }

    const store = ensureStore();
    const existingIdx = store.savedBooks.findIndex(
      (b) => b.userId === req.authUser!.id && b.bookId === bookId
    );
    const entry: StoredSavedBook = {
      userId: req.authUser!.id,
      bookId,
      savedAt: new Date().toISOString(),
      bookSnapshot,
    };
    if (existingIdx >= 0) {
      store.savedBooks[existingIdx] = entry;
    } else {
      store.savedBooks.push(entry);
    }
    saveStore(store);
    res.json({ savedBook: entry });
  });

  app.delete('/api/library/:bookId', requireAuth, (req: AuthedRequest, res) => {
    const bookId = req.params.bookId;
    const store = ensureStore();
    store.savedBooks = store.savedBooks.filter(
      (b) => !(b.userId === req.authUser!.id && b.bookId === bookId)
    );
    saveStore(store);
    res.json({ ok: true });
  });

  // Listening Progress CRUD
  app.get('/api/progress', requireAuth, (req: AuthedRequest, res) => {
    const store = ensureStore();
    const items = store.progress
      .filter((p) => p.userId === req.authUser!.id)
      .sort((a, b) => b.lastListenedAt.localeCompare(a.lastListenedAt));
    res.json({ progress: items });
  });

  app.put('/api/progress', requireAuth, (req: AuthedRequest, res) => {
    const body = req.body || {};
    const bookId = typeof body.bookId === 'string' ? body.bookId.trim() : '';
    if (!bookId || bookId.length > 140) {
      res.status(400).json({ error: 'Invalid bookId.' });
      return;
    }

    const entry: StoredProgress = {
      userId: req.authUser!.id,
      bookId,
      chapterIndex: Math.max(0, Math.floor(Number(body.chapterIndex) || 0)),
      chapterTitle: typeof body.chapterTitle === 'string' ? body.chapterTitle.slice(0, 200) : '',
      positionSeconds: Math.max(0, Number(body.positionSeconds) || 0),
      chapterDurationSeconds: Math.max(0, Number(body.chapterDurationSeconds) || 0),
      totalElapsedSeconds: Math.max(0, Number(body.totalElapsedSeconds) || 0),
      totalBookDurationSeconds: Math.max(0, Number(body.totalBookDurationSeconds) || 0),
      playbackSpeed: Number(body.playbackSpeed) || 1,
      completed: Boolean(body.completed),
      lastListenedAt: new Date().toISOString(),
      bookSnapshot: body.bookSnapshot,
    };

    const store = ensureStore();
    const idx = store.progress.findIndex(
      (p) => p.userId === req.authUser!.id && p.bookId === bookId
    );
    if (idx >= 0) {
      store.progress[idx] = entry;
    } else {
      store.progress.push(entry);
    }
    saveStore(store);
    res.json({ progress: entry });
  });

  // Vite middleware in development, static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aublix listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
