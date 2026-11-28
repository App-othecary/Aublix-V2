import { Audiobook } from '../types/audiobook';
import { FALLBACK_CATALOG } from './fallbackCatalog';
import rawTop100 from './top100Catalog.json';

const BESPOKE_COVERS_BY_ID: Record<string, string> = {
  art_of_war_librivox: '/src/assets/images/cover_art_of_war_1795868234898.jpg',
  moby_dick_librivox: '/src/assets/images/cover_moby_dick_1795868235558.jpg',
  odyssey_butler_librivox: '/src/assets/images/cover_odyssey_1795868236401.jpg',
  count_monte_cristo_0711_librivox:
    '/src/assets/images/cover_monte_cristo_1795868236342.jpg',
  jane_eyre_ver03_0809_librivox:
    '/src/assets/images/cover_jane_eyre_1795868236689.jpg',
  tale_two_cities_librivox:
    '/src/assets/images/cover_tale_two_cities_1795868238001.jpg',
  treasure_island_ap_librivox:
    '/src/assets/images/cover_treasure_island_1795868238030.jpg',
  secret_garden_librivox:
    '/src/assets/images/cover_secret_garden_1795868238815.jpg',
  huck_finn_librivox: '/src/assets/images/cover_huck_finn_1795868239051.jpg',
  invisible_man_librivox:
    '/src/assets/images/cover_invisible_man_1795868239245.jpg',
  anne_greengables_librivox:
    '/src/assets/images/cover_anne_green_gables_1795868240459.jpg',
  pride_and_prejudice_librivox:
    '/src/assets/images/cover_pride_prejudice_1795345687934.jpg',
  frankenstein_shelley:
    '/src/assets/images/cover_frankenstein_1795345688170.jpg',
  'the-great-gatsby-full-audiobook':
    '/src/assets/images/cover_great_gatsby_1795345687976.jpg',
  adventures_sherlock_holmes_rg_librivox:
    '/src/assets/images/cover_sherlock_holmes_1795345687772.jpg',
  adventures_holmes:
    '/src/assets/images/cover_sherlock_holmes_1795345687772.jpg',
  meditations_0708_librivox:
    '/src/assets/images/cover_meditations_1795345687669.jpg',
  time_machine_ms_librivox:
    '/src/assets/images/cover_time_machine_1795345688511.jpg',
  dracula_librivox: '/src/assets/images/cover_dracula_1795345687481.jpg',
  aliceinwonderland_2106_librivox:
    '/src/assets/images/cover_alice_wonderland_1795345688256.jpg',
  alice_in_wonderland_librivox:
    '/src/assets/images/cover_alice_wonderland_1795345688256.jpg',
  alices_adventures_1003:
    '/src/assets/images/cover_alice_wonderland_1795345688256.jpg',
};

const CLOTHBOUND_PALETTE = [
  '#6E2B2E', // Oxblood Crimson
  '#223A54', // Prussian Blue
  '#254438', // Forest Pine
  '#4A314D', // Heather Plum
  '#7A4326', // Burnt Sienna
  '#2C364F', // Slate Indigo
  '#4B4E2D', // Antique Olive
  '#5A4632', // Espresso Umber
];

function pickClothAccent(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CLOTHBOUND_PALETTE[hash % CLOTHBOUND_PALETTE.length];
}

function normalizeTitleKey(title: string, author: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/,\s*by\s+.*$/i, '')
    .replace(/\s*\(version[^)]*\)/gi, '')
    .replace(/\s*\(ver[^)]*\)/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const cleanAuthor = author
    .toLowerCase()
    .replace(/^sir\s+/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return `${cleanTitle}::${cleanAuthor}`;
}

const top100Entries = rawTop100 as Audiobook[];

const topById = new Map<string, Audiobook>();
const topByTitle = new Map<string, Audiobook>();
for (const item of top100Entries) {
  topById.set(item.id, item);
  topByTitle.set(normalizeTitleKey(item.title, item.author), item);
}

const curatedEnriched: Audiobook[] = FALLBACK_CATALOG.map((curated) => {
  const match =
    topById.get(curated.id) ||
    topByTitle.get(normalizeTitleKey(curated.title, curated.author));
  const bespokeCover = BESPOKE_COVERS_BY_ID[curated.id] || curated.coverUrl;
  if (match && match.chapters.length > curated.chapters.length) {
    return {
      ...curated,
      coverUrl: bespokeCover,
      chapters: match.chapters,
      totalDurationSeconds: match.totalDurationSeconds,
      chaptersPrebaked: true,
    };
  }
  return {
    ...curated,
    coverUrl: bespokeCover,
    chaptersPrebaked: true,
  };
});

const seenIds = new Set(curatedEnriched.map((b) => b.id));
const seenTitleKeys = new Set(
  curatedEnriched.map((b) => normalizeTitleKey(b.title, b.author))
);

const additionalTopBooks: Audiobook[] = [];
for (const entry of top100Entries) {
  const titleKey = normalizeTitleKey(entry.title, entry.author);
  if (seenIds.has(entry.id) || seenTitleKeys.has(titleKey)) {
    continue;
  }
  seenIds.add(entry.id);
  seenTitleKeys.add(titleKey);

  const bespokeCover = BESPOKE_COVERS_BY_ID[entry.id] || '';
  additionalTopBooks.push({
    ...entry,
    // Use bespoke illustrations where available; otherwise render crisp clothbound typographic covers
    coverUrl: bespokeCover,
    coverAccent: pickClothAccent(entry.id),
    chaptersPrebaked: true,
  });
}

additionalTopBooks.sort((a, b) => {
  const aHas = a.coverUrl ? 0 : 1;
  const bHas = b.coverUrl ? 0 : 1;
  return aHas - bHas;
});

export const FULL_CATALOG: Audiobook[] = [
  ...curatedEnriched,
  ...additionalTopBooks,
];
