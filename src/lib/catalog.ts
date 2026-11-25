import { FALLBACK_CATALOG } from '../data/fallbackCatalog';
import { Audiobook, Chapter, GenreCategory } from '../types/audiobook';

export async function searchAudiobooks(query: string): Promise<Audiobook[]> {
  const q = query.trim().toLowerCase();
  const localMatches = FALLBACK_CATALOG.filter(
    (book) =>
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.genre.toLowerCase().includes(q) ||
      book.synopsis.toLowerCase().includes(q)
  );

  if (!q || q.length < 2) {
    return localMatches;
  }

  try {
    const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) return localMatches;
    const data = (await res.json()) as { books?: Audiobook[] };
    const remoteBooks = Array.isArray(data.books) ? data.books : [];

    const seenIds = new Set(localMatches.map((b) => b.id));
    const merged = [...localMatches];
    for (const book of remoteBooks) {
      if (book && book.id && !seenIds.has(book.id)) {
        seenIds.add(book.id);
        merged.push(book);
      }
    }
    return merged;
  } catch {
    return localMatches;
  }
}

export async function fetchFullBookChapters(archiveId: string): Promise<Chapter[] | null> {
  try {
    const res = await fetch(`/api/audiobooks/${encodeURIComponent(archiveId)}/tracks`);
    if (!res.ok) return null;
    const data = (await res.json()) as { chapters?: Chapter[] };
    if (Array.isArray(data.chapters) && data.chapters.length > 0) {
      return data.chapters;
    }
    return null;
  } catch {
    return null;
  }
}

export function filterBooksByCategory(
  books: Audiobook[],
  category: GenreCategory
): Audiobook[] {
  if (category === 'All') return books;
  if (category === 'Under 3 Hours') {
    return books.filter((b) => b.totalDurationSeconds <= 3 * 3600);
  }
  return books.filter((b) => b.genre === category);
}
