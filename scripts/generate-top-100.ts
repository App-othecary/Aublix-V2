import fs from 'fs';
import path from 'path';
import type { Audiobook, Chapter } from '../src/types/audiobook';

interface ArchiveDoc {
  identifier?: string;
  title?: string;
  creator?: string | string[];
  description?: string | string[];
  subject?: string | string[];
  date?: string;
  runtime?: string;
}

interface ArchiveFile {
  name?: string;
  title?: string;
  track?: string;
  length?: string;
}

const OUTPUT_PATH = path.resolve(process.cwd(), 'src/data/top100Catalog.json');
const TARGET_COUNT = 100;
const FETCH_ROWS = 140;
const CONCURRENCY = 6;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code) || 32));
}

function cleanText(input: unknown, fallback = ''): string {
  if (Array.isArray(input)) return cleanText(input[0], fallback);
  if (typeof input !== 'string') return fallback;
  const stripped = input
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return decodeHtmlEntities(stripped) || fallback;
}

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

function mapSubjectToGenre(
  subjectRaw: string,
  titleRaw: string
): Audiobook['genre'] {
  const s = `${subjectRaw} ${titleRaw}`.toLowerCase();
  if (
    s.includes('mystery') ||
    s.includes('horror') ||
    s.includes('gothic') ||
    s.includes('detective') ||
    s.includes('sherlock') ||
    s.includes('dracula') ||
    s.includes('frankenstein') ||
    s.includes('poe') ||
    s.includes('ghost')
  ) {
    return 'Mystery & Gothic';
  }
  if (
    s.includes('philosophy') ||
    s.includes('ethics') ||
    s.includes('stoic') ||
    s.includes('meditations') ||
    s.includes('republic') ||
    s.includes('nietzsche') ||
    s.includes('aristotle') ||
    s.includes('plato') ||
    s.includes('art of war') ||
    s.includes('essays')
  ) {
    return 'Philosophy';
  }
  if (
    s.includes('science fiction') ||
    s.includes('fantasy') ||
    s.includes('wonderland') ||
    s.includes('time machine') ||
    s.includes('war of the worlds') ||
    s.includes('jules verne') ||
    s.includes('oz') ||
    s.includes('utopia')
  ) {
    return 'Sci-Fi & Fantasy';
  }
  return 'Classics';
}

function parseYear(dateRaw: string | undefined): number {
  if (!dateRaw) return 1900;
  const match = String(dateRaw).match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
  return match ? Number(match[1]) : 1900;
}

async function fetchBookWithChapters(doc: ArchiveDoc): Promise<Audiobook | null> {
  const id = doc.identifier;
  if (!id || !/^[a-zA-Z0-9_-]{3,120}$/.test(id)) return null;

  try {
    const res = await fetch(
      `https://archive.org/metadata/${encodeURIComponent(id)}/files`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: ArchiveFile[] };
    const files = json.result || [];

    let mp3Files = files.filter(
      (f) => f.name && f.name.toLowerCase().endsWith('_64kb.mp3')
    );
    if (mp3Files.length === 0) {
      mp3Files = files.filter(
        (f) => f.name && f.name.toLowerCase().endsWith('.mp3')
      );
    }
    if (mp3Files.length === 0) return null;

    const allHaveTrack = mp3Files.every((f) =>
      Boolean(f.track && /^\d+/.test(f.track))
    );
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

    const chapters: Chapter[] = mp3Files.slice(0, 80).map((f, index) => {
      const rawName = f.name || `track_${index + 1}.mp3`;
      const fallbackTitle = rawName
        .replace(/_64kb\.mp3$/i, '')
        .replace(/\.mp3$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim();

      return {
        id: `${id}-${index}`,
        index,
        title: cleanText(f.title) || fallbackTitle || `Chapter ${index + 1}`,
        durationSeconds: parseSeconds(f.length) || 600,
        audioUrl: `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(rawName).replace(/%2F/g, '/')}`,
      };
    });

    const totalDurationSeconds =
      chapters.reduce((sum, c) => sum + c.durationSeconds, 0) ||
      parseSeconds(doc.runtime) ||
      3600;

    const subjectStr = Array.isArray(doc.subject)
      ? doc.subject.join(' ')
      : String(doc.subject || '');
    const title = cleanText(doc.title, 'Untitled Audiobook');
    const author = cleanText(doc.creator, 'Public Domain Author');
    const rawSynopsis = cleanText(
      doc.description,
      'Free public-domain audiobook recording from the LibriVox and Internet Archive collection.'
    );

    return {
      id,
      archiveId: id,
      title,
      author,
      narrator: 'LibriVox Volunteer',
      edition: 'LibriVox Public Domain',
      year: parseYear(doc.date),
      genre: mapSubjectToGenre(subjectStr, title),
      synopsis:
        rawSynopsis.length > 360
          ? `${rawSynopsis.slice(0, 357).trim()}...`
          : rawSynopsis,
      coverUrl: `https://archive.org/services/img/${encodeURIComponent(id)}`,
      coverAccent: '#8B6F3E',
      totalDurationSeconds,
      chapters,
      source: 'librivox',
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log('Fetching top English LibriVox audiobooks from Internet Archive...');
  const query =
    'collection:librivoxaudio AND mediatype:audio AND language:(eng OR English)';
  const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator,description,subject,date,runtime&sort[]=downloads+desc&rows=${FETCH_ROWS}&output=json`;

  const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
  if (!searchRes.ok) {
    throw new Error(`Archive search failed with HTTP ${searchRes.status}`);
  }
  const searchJson = (await searchRes.json()) as {
    response?: { docs?: ArchiveDoc[] };
  };
  const docs = searchJson.response?.docs || [];
  console.log(`Received ${docs.length} candidate entries. Fetching chapter lists...`);

  const results: Audiobook[] = [];
  const seenTitleKeys = new Set<string>();

  for (let i = 0; i < docs.length && results.length < TARGET_COUNT; i += CONCURRENCY) {
    const batch = docs.slice(i, i + CONCURRENCY);
    const resolved = await Promise.all(batch.map(fetchBookWithChapters));
    for (const book of resolved) {
      if (!book) continue;
      // Deduplicate alternate LibriVox versions of the same title
      const titleKey = `${book.title.toLowerCase().replace(/\s*\(version[^)]*\)/gi, '').trim()}::${book.author.toLowerCase()}`;
      if (seenTitleKeys.has(titleKey)) continue;
      seenTitleKeys.add(titleKey);
      results.push(book);
      if (results.length >= TARGET_COUNT) break;
    }
    console.log(`Collected ${results.length}/${TARGET_COUNT} audiobooks...`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved ${results.length} audiobooks to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Failed to generate Top 100 catalog:', err);
  process.exit(1);
});
