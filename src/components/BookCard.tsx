import { Play } from 'lucide-react';
import { formatDurationCompact } from '../lib/format';
import { Audiobook, ListeningProgress } from '../types/audiobook';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Audiobook;
  progress?: ListeningProgress;
  onSelect: (book: Audiobook) => void;
  onQuickPlay?: (book: Audiobook) => void;
  className?: string;
}

export function BookCard({
  book,
  progress,
  onSelect,
  onQuickPlay,
  className = '',
}: BookCardProps) {
  const progressFraction =
    progress && book.totalDurationSeconds > 0
      ? Math.min(1, progress.totalElapsedSeconds / book.totalDurationSeconds)
      : undefined;

  const remainingSeconds =
    progress && book.totalDurationSeconds > 0
      ? Math.max(0, book.totalDurationSeconds - progress.totalElapsedSeconds)
      : null;

  return (
    <article
      className={`group relative flex flex-col text-left ${className}`}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => onSelect(book)}
          className="block w-full rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
          aria-label={`Open ${book.title} by ${book.author}`}
        >
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            accentColor={book.coverAccent}
            progressFraction={progressFraction}
          />
        </button>

        {onQuickPlay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickPlay(book);
            }}
            aria-label={`Play ${book.title}`}
            className="absolute right-2.5 bottom-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#0B0D11]/85 text-[#F4F1EA] opacity-0 shadow-lg ring-1 ring-white/20 backdrop-blur-md transition-all duration-150 group-hover:opacity-100 hover:bg-[#E5A93C] hover:text-[#0B0D11] focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[#E5A93C] sm:flex"
          >
            <Play className="h-4 w-4 fill-current translate-x-0.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelect(book)}
        className="mt-2.5 flex flex-col items-start text-left focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
      >
        <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-[#F4F1EA] transition-colors group-hover:text-[#E5A93C]">
          {book.title}
        </h3>
        <div className="mt-0.5 flex w-full items-center gap-1.5 text-xs text-[#9BA1AE]">
          <span className="truncate">{book.author}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular shrink-0 text-[11px]">
            {remainingSeconds !== null
              ? `${formatDurationCompact(remainingSeconds)} left`
              : formatDurationCompact(book.totalDurationSeconds)}
          </span>
        </div>
      </button>
    </article>
  );
}
