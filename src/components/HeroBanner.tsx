import { Bookmark, Check, Info, Play } from 'lucide-react';
import { formatDurationCompact } from '../lib/format';
import { Audiobook, ListeningProgress } from '../types/audiobook';
import { BookCover } from './BookCover';

interface HeroBannerProps {
  book: Audiobook;
  progress?: ListeningProgress;
  isSaved: boolean;
  onListenNow: (book: Audiobook) => void;
  onOpenDetails: (book: Audiobook) => void;
  onToggleSave: (book: Audiobook) => void;
}

export function HeroBanner({
  book,
  progress,
  isSaved,
  onListenNow,
  onOpenDetails,
  onToggleSave,
}: HeroBannerProps) {
  const isResuming = Boolean(progress && progress.totalElapsedSeconds > 5);

  return (
    <section
      aria-label="Featured audiobook"
      className="relative overflow-hidden rounded-2xl bg-[#13161D] ring-1 ring-white/[0.08]"
    >
      {/* Atmospheric blurred cover backdrop */}
      {book.coverUrl && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src={book.coverUrl}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="h-full w-full scale-110 object-cover opacity-25 blur-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11] via-[#0B0D11]/75 to-[#0B0D11]/40 md:bg-gradient-to-r md:from-[#0B0D11] md:via-[#0B0D11]/85 md:to-transparent" />
        </div>
      )}

      <div className="relative z-10 grid grid-cols-1 items-center gap-6 p-5 sm:p-7 md:grid-cols-[1fr_220px] md:gap-10 lg:grid-cols-[1fr_250px] lg:p-10">
        {/* Copy & Actions */}
        <div className="order-2 flex flex-col items-start md:order-1">
          <p className="text-xs font-medium tracking-wide text-[#E5A93C]">
            Featured Public Domain Edition
          </p>

          <h1 className="font-display mt-2 max-w-2xl text-2xl leading-tight font-semibold text-balance text-[#F4F1EA] sm:text-4xl lg:text-[2.65rem]">
            {book.title}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#C2C7D0] sm:text-sm">
            <span>{book.author}</span>
            <span aria-hidden="true">·</span>
            <span>Read by {book.narrator}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {formatDurationCompact(book.totalDurationSeconds)}
            </span>
          </div>

          <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-[#A7ADB9] sm:text-[15px]">
            {book.synopsis}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onListenNow(book)}
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-xl bg-[#E5A93C] px-5 py-2.5 text-sm font-semibold text-[#0B0D11] shadow-lg shadow-[#E5A93C]/15 transition-colors hover:bg-[#EEB854] active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>{isResuming ? 'Resume Listening' : 'Listen Now'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDetails(book)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/[0.07] px-4 py-2.5 text-sm font-medium text-[#F4F1EA] ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
            >
              <Info className="h-4 w-4 text-[#C2C7D0]" aria-hidden="true" />
              <span>Chapters & Details</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(book)}
              aria-label={isSaved ? 'Remove from library' : 'Save to library'}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/[0.05] px-3 text-sm font-medium text-[#F4F1EA] ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
            >
              {isSaved ? (
                <Check className="h-4 w-4 text-[#E5A93C]" aria-hidden="true" />
              ) : (
                <Bookmark className="h-4 w-4 text-[#C2C7D0]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Cover */}
        <div className="order-1 mx-auto w-36 sm:w-44 md:order-2 md:w-full">
          <button
            type="button"
            onClick={() => onOpenDetails(book)}
            className="group block w-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E5A93C]"
            aria-label={`View ${book.title}`}
          >
            <BookCover
              title={book.title}
              author={book.author}
              coverUrl={book.coverUrl}
              accentColor={book.coverAccent}
              priority
              progressFraction={
                progress && book.totalDurationSeconds > 0
                  ? progress.totalElapsedSeconds / book.totalDurationSeconds
                  : undefined
              }
            />
          </button>
        </div>
      </div>
    </section>
  );
}
