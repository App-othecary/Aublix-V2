import {
  BookMarked,
  Compass,
  Loader2,
  LogOut,
  Search,
  User,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { BookCard } from './components/BookCard';
import { BookCarouselRail } from './components/BookCarouselRail';
import { BookDetailDrawer } from './components/BookDetailDrawer';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { HeroBanner } from './components/HeroBanner';
import { MiniPlayer } from './components/MiniPlayer';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioPlayerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FALLBACK_CATALOG } from './data/fallbackCatalog';
import { filterBooksByCategory, searchAudiobooks } from './lib/catalog';
import { formatDurationCompact } from './lib/format';
import { Audiobook, GenreCategory } from './types/audiobook';

type NavTab = 'discover' | 'browse' | 'library' | 'account';

const CATEGORY_FILTERS: GenreCategory[] = [
  'All',
  'Classics',
  'Mystery & Gothic',
  'Philosophy',
  'Sci-Fi & Fantasy',
  'Under 3 Hours',
];

function StreamingAppShell() {
  const {
    user,
    savedBooks,
    progressMap,
    continueListening,
    isBookSaved,
    toggleSaveBook,
    openAuthModal,
    signOut,
    isSupabaseMode,
  } = useAuth();
  const { activeBook, playBook } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [selectedBook, setSelectedBook] = useState<Audiobook | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GenreCategory>('All');
  const [searchResults, setSearchResults] = useState<Audiobook[]>(FALLBACK_CATALOG);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search hitting curated catalog + live LibriVox / Internet Archive API
  useEffect(() => {
    let active = true;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(FALLBACK_CATALOG);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      const books = await searchAudiobooks(trimmed);
      if (active) {
        setSearchResults(books);
        setIsSearching(false);
      }
    }, 320);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredBooks = useMemo(
    () => filterBooksByCategory(searchResults, selectedCategory),
    [searchResults, selectedCategory]
  );

  const featuredBook = useMemo(
    () => FALLBACK_CATALOG.find((b) => b.featured) || FALLBACK_CATALOG[0],
    []
  );

  const popularClassics = useMemo(
    () =>
      FALLBACK_CATALOG.filter(
        (b) => b.genre === 'Classics' || b.genre === 'Philosophy'
      ),
    []
  );

  const shortListens = useMemo(
    () => FALLBACK_CATALOG.filter((b) => b.totalDurationSeconds <= 3 * 3600),
    []
  );

  const mysteryGothic = useMemo(
    () => FALLBACK_CATALOG.filter((b) => b.genre === 'Mystery & Gothic'),
    []
  );

  const continueBooks = useMemo(
    () =>
      continueListening
        .map((item) => item.bookSnapshot)
        .filter((b): b is Audiobook => Boolean(b)),
    [continueListening]
  );

  const isFilteringDiscover =
    activeTab === 'discover' &&
    (searchQuery.trim().length > 0 || selectedCategory !== 'All');

  const bottomSpacerClass = activeBook ? 'pb-36 md:pb-24' : 'pb-24 md:pb-12';

  return (
    <div className="min-h-dvh bg-[#0B0D11] text-[#F4F1EA]">
      {/* Top Bar Contract: 3 zones (wordmark — 4 nav links — 1 primary action) */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0B0D11]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('discover');
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="font-display text-xl font-semibold tracking-tight text-[#F4F1EA] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
          >
            Aublix
          </button>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 text-sm font-medium md:flex"
          >
            {(
              [
                { id: 'discover', label: 'Discover' },
                { id: 'browse', label: 'Browse' },
                { id: 'library', label: 'Library' },
                { id: 'account', label: 'Account' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                  activeTab === item.id
                    ? 'text-[#E5A93C]'
                    : 'text-[#A7ADB9] hover:text-[#F4F1EA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className="inline-flex min-h-[40px] max-w-[160px] items-center gap-2 rounded-xl bg-white/[0.07] px-3.5 text-xs font-medium text-[#F4F1EA] ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
              >
                <User className="h-3.5 w-3.5 shrink-0 text-[#E5A93C]" aria-hidden="true" />
                <span className="truncate">{user.displayName}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="inline-flex min-h-[40px] items-center rounded-xl bg-[#E5A93C] px-4 text-xs font-semibold text-[#0B0D11] transition-colors hover:bg-[#EEB854] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        className={`mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-10 ${bottomSpacerClass}`}
      >
        {/* DISCOVER VIEW */}
        {activeTab === 'discover' && (
          <div className="space-y-8">
            {/* Search & Category Filter Bar */}
            <section aria-label="Search and filters" className="space-y-3.5">
              <div className="relative max-w-xl">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A818F]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search classics, authors, or LibriVox catalog..."
                  aria-label="Search public-domain audiobooks"
                  className="h-11 w-full rounded-xl bg-[#13161D] pr-10 pl-10 text-sm text-[#F4F1EA] ring-1 ring-white/[0.08] placeholder:text-[#6D7482] focus:ring-[#E5A93C] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8C93A1] hover:text-white"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div
                className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
                role="tablist"
                aria-label="Audiobook category filters"
              >
                {CATEGORY_FILTERS.map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCategory(category)}
                      className={`min-h-[40px] rounded-full px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                        active
                          ? 'bg-[#E5A93C] font-semibold text-[#0B0D11]'
                          : 'bg-[#13161D] text-[#A7ADB9] ring-1 ring-white/[0.08] hover:bg-[#1B1F29] hover:text-[#F4F1EA]'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </section>

            {isFilteringDiscover ? (
              <section aria-label="Filtered results" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-[#F4F1EA]">
                    {searchQuery.trim()
                      ? `Results for "${searchQuery.trim()}"`
                      : selectedCategory}
                  </h2>
                  {isSearching && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#9BA1AE]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      <span>Searching archive</span>
                    </span>
                  )}
                </div>

                {filteredBooks.length === 0 && !isSearching ? (
                  <div className="rounded-2xl bg-[#13161D] px-6 py-12 text-center ring-1 ring-white/[0.08]">
                    <p className="text-sm font-medium text-[#F4F1EA]">
                      No matching audiobooks found
                    </p>
                    <p className="mt-1 text-xs text-[#8C93A1]">
                      Try another title, author name, or reset your category filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                      }}
                      className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-white/[0.07] px-4 text-xs font-medium text-[#F4F1EA] hover:bg-white/[0.12]"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
                    {filteredBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        progress={progressMap[book.id]}
                        onSelect={setSelectedBook}
                        onQuickPlay={(b) => playBook(b)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Featured Hero */}
                <HeroBanner
                  book={featuredBook}
                  progress={progressMap[featuredBook.id]}
                  isSaved={isBookSaved(featuredBook.id)}
                  onListenNow={(b) => playBook(b)}
                  onOpenDetails={setSelectedBook}
                  onToggleSave={toggleSaveBook}
                />

                {/* Continue Listening (shown when signed in with active progress) */}
                {user && continueBooks.length > 0 && (
                  <BookCarouselRail
                    title="Continue Listening"
                    subtitle="Pick up right where you paused"
                    books={continueBooks}
                    progressMap={progressMap}
                    onSelectBook={setSelectedBook}
                    onQuickPlay={(b) => playBook(b)}
                  />
                )}

                <BookCarouselRail
                  title="Popular Classics"
                  subtitle="Essential unabridged literature in the public domain"
                  books={popularClassics}
                  progressMap={progressMap}
                  onSelectBook={setSelectedBook}
                  onQuickPlay={(b) => playBook(b)}
                />

                <BookCarouselRail
                  title="Short Listens (Under 3 Hours)"
                  subtitle="Focused essays, novellas, and afternoon editions"
                  books={shortListens}
                  progressMap={progressMap}
                  onSelectBook={setSelectedBook}
                  onQuickPlay={(b) => playBook(b)}
                />

                <BookCarouselRail
                  title="Mystery & Gothic"
                  subtitle="Atmospheric tales for late-night listening"
                  books={mysteryGothic}
                  progressMap={progressMap}
                  onSelectBook={setSelectedBook}
                  onQuickPlay={(b) => playBook(b)}
                />
              </>
            )}
          </div>
        )}

        {/* BROWSE VIEW */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[#F4F1EA] sm:text-3xl">
                Browse Catalog
              </h1>
              <p className="mt-1 text-sm text-[#9BA1AE]">
                Search curated classics or discover thousands of LibriVox recordings.
              </p>
            </div>

            <div className="relative max-w-xl">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#7A818F]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by book title or author (e.g. Moby Dick, Tolstoy)..."
                aria-label="Browse public-domain audiobooks"
                className="h-11 w-full rounded-xl bg-[#13161D] pr-10 pl-10 text-sm text-[#F4F1EA] ring-1 ring-white/[0.08] placeholder:text-[#6D7482] focus:ring-[#E5A93C] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8C93A1] hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div
              className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
              role="tablist"
              aria-label="Browse category filters"
            >
              {CATEGORY_FILTERS.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(category)}
                    className={`min-h-[40px] rounded-full px-4 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                      active
                        ? 'bg-[#E5A93C] font-semibold text-[#0B0D11]'
                        : 'bg-[#13161D] text-[#A7ADB9] ring-1 ring-white/[0.08] hover:bg-[#1B1F29] hover:text-[#F4F1EA]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {isSearching && (
              <div className="flex items-center gap-2 text-xs text-[#9BA1AE]">
                <Loader2 className="h-4 w-4 animate-spin text-[#E5A93C]" aria-hidden="true" />
                <span>Fetching public-domain recordings from Internet Archive...</span>
              </div>
            )}

            {filteredBooks.length === 0 && !isSearching ? (
              <div className="rounded-2xl bg-[#13161D] px-6 py-12 text-center ring-1 ring-white/[0.08]">
                <p className="text-sm font-medium text-[#F4F1EA]">
                  No audiobooks matched your filter
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-white/[0.07] px-4 text-xs font-medium text-[#F4F1EA]"
                >
                  Show All Books
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    progress={progressMap[book.id]}
                    onSelect={setSelectedBook}
                    onQuickPlay={(b) => playBook(b)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* LIBRARY VIEW */}
        {activeTab === 'library' && (
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[#F4F1EA] sm:text-3xl">
                Your Library
              </h1>
              <p className="mt-1 text-sm text-[#9BA1AE]">
                Saved editions and synced listening progress.
              </p>
            </div>

            {!user ? (
              <div className="rounded-2xl bg-[#13161D] p-7 text-center ring-1 ring-white/[0.08] sm:p-10">
                <BookMarked
                  className="mx-auto h-9 w-9 text-[#E5A93C]"
                  aria-hidden="true"
                />
                <h2 className="font-display mt-4 text-xl font-semibold text-[#F4F1EA]">
                  Save books & sync timestamps
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#9BA1AE]">
                  You can browse and stream any audiobook as a guest. Sign in to
                  bookmark titles and pick up where you left off across sessions.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openAuthModal('Sign in to access your saved library and listening history.')
                  }
                  className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-[#E5A93C] px-6 text-sm font-semibold text-[#0B0D11] transition-colors hover:bg-[#EEB854]"
                >
                  Sign In or Create Account
                </button>
              </div>
            ) : (
              <>
                {continueBooks.length > 0 && (
                  <BookCarouselRail
                    title="In Progress"
                    books={continueBooks}
                    progressMap={progressMap}
                    onSelectBook={setSelectedBook}
                    onQuickPlay={(b) => playBook(b)}
                  />
                )}

                <section aria-label="Saved books" className="space-y-4">
                  <h2 className="font-display text-lg font-semibold text-[#F4F1EA] sm:text-xl">
                    Saved Books ({savedBooks.length})
                  </h2>

                  {savedBooks.length === 0 ? (
                    <div className="rounded-2xl bg-[#13161D] px-6 py-10 text-center ring-1 ring-white/[0.08]">
                      <p className="text-sm font-medium text-[#F4F1EA]">
                        No saved books yet
                      </p>
                      <p className="mt-1 text-xs text-[#8C93A1]">
                        Open any audiobook and tap Save to Library to keep it here.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('discover')}
                        className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-white/[0.08] px-4 text-xs font-medium text-[#F4F1EA] hover:bg-white/[0.12]"
                      >
                        Explore Discover
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
                      {savedBooks.map((item) => (
                        <BookCard
                          key={item.bookId}
                          book={item.bookSnapshot}
                          progress={progressMap[item.bookId]}
                          onSelect={setSelectedBook}
                          onQuickPlay={(b) => playBook(b)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {/* ACCOUNT VIEW */}
        {activeTab === 'account' && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[#F4F1EA] sm:text-3xl">
                Account & Sync
              </h1>
              <p className="mt-1 text-sm text-[#9BA1AE]">
                Manage your reader profile and listening preferences.
              </p>
            </div>

            {user ? (
              <div className="rounded-2xl bg-[#13161D] p-6 ring-1 ring-white/[0.08]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#E5A93C]">
                      {isSupabaseMode
                        ? 'Supabase Cloud Account'
                        : 'Local Prototype Account'}
                    </p>
                    <h2 className="font-display mt-1 text-xl font-semibold text-[#F4F1EA]">
                      {user.displayName}
                    </h2>
                    <p className="text-sm text-[#9BA1AE]">{user.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-xs font-medium text-[#F4F1EA] ring-1 ring-white/10 transition-colors hover:bg-white/[0.12]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-5">
                  <div>
                    <p className="text-xs text-[#8C93A1]">Saved Books</p>
                    <p className="font-mono-tabular mt-1 text-2xl font-semibold text-[#F4F1EA]">
                      {savedBooks.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8C93A1]">Books In Progress</p>
                    <p className="font-mono-tabular mt-1 text-2xl font-semibold text-[#F4F1EA]">
                      {continueListening.length}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#13161D] p-6 ring-1 ring-white/[0.08]">
                <h2 className="font-display text-lg font-semibold text-[#F4F1EA]">
                  Guest Listener
                </h2>
                <p className="mt-1.5 text-sm text-[#9BA1AE]">
                  Sign in with email and password or a Supabase magic link to keep your
                  saved library and playback timestamps synced.
                </p>
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-[#E5A93C] px-5 text-sm font-semibold text-[#0B0D11] transition-colors hover:bg-[#EEB854]"
                >
                  Sign In
                </button>
              </div>
            )}

            <div className="rounded-2xl bg-[#13161D] p-6 ring-1 ring-white/[0.08]">
              <h3 className="text-sm font-semibold text-[#F4F1EA]">
                Public Domain Audio Sources
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9BA1AE]">
                All recordings in Aublix are free, public-domain works sourced from
                LibriVox volunteers and hosted by the Internet Archive. Curated
                editions include {FALLBACK_CATALOG.length} complete works (
                {formatDurationCompact(
                  FALLBACK_CATALOG.reduce((s, b) => s + b.totalDurationSeconds, 0)
                )}{' '}
                total runtime), plus live catalog search.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/[0.08] bg-[#101319]/95 backdrop-blur-lg md:hidden"
      >
        <div className="pb-safe grid h-16 grid-cols-4 items-center">
          {(
            [
              { id: 'discover', label: 'Discover', icon: Compass },
              { id: 'browse', label: 'Browse', icon: Search },
              { id: 'library', label: 'Library', icon: BookMarked },
              { id: 'account', label: 'Account', icon: User },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                  active ? 'text-[#E5A93C]' : 'text-[#8C93A1]'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-[11px] font-medium tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Persistent Audio Players & Modals */}
      <MiniPlayer />
      <FullScreenPlayer />
      <BookDetailDrawer
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <StreamingAppShell />
      </AudioPlayerProvider>
    </AuthProvider>
  );
}
