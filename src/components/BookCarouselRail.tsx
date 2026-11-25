import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Audiobook, ListeningProgress } from '../types/audiobook';
import { BookCard } from './BookCard';

interface BookCarouselRailProps {
  title: string;
  subtitle?: string;
  books: Audiobook[];
  progressMap?: Record<string, ListeningProgress>;
  onSelectBook: (book: Audiobook) => void;
  onQuickPlay?: (book: Audiobook) => void;
}

export function BookCarouselRail({
  title,
  subtitle,
  books,
  progressMap,
  onSelectBook,
  onQuickPlay,
}: BookCarouselRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);

  if (books.length === 0) return null;

  const scrollByAmount = (direction: 'prev' | 'next') => {
    const el = railRef.current;
    if (!el) return;
    const distance = Math.max(260, el.clientWidth * 0.72);
    el.scrollBy({
      left: direction === 'next' ? distance : -distance,
      behavior: 'smooth',
    });
  };

  return (
    <section aria-label={title} className="space-y-3.5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#F4F1EA] sm:text-xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[#8C93A1]">{subtitle}</p>
          )}
        </div>

        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => scrollByAmount('prev')}
            aria-label={`Scroll ${title} left`}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-[#C2C7D0] ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount('next')}
            aria-label={`Scroll ${title} right`}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-[#C2C7D0] ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-5 sm:px-0"
      >
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            progress={progressMap?.[book.id]}
            onSelect={onSelectBook}
            onQuickPlay={onQuickPlay}
            className="w-[144px] shrink-0 snap-start sm:w-[168px] lg:w-[180px]"
          />
        ))}
      </div>
    </section>
  );
}
