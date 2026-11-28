import {
  Bookmark,
  Check,
  Loader2,
  Pause,
  Play,
  Volume2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { fetchFullBookChapters } from '../lib/catalog';
import { formatDurationCompact, formatTimestamp } from '../lib/format';
import { Audiobook, Chapter } from '../types/audiobook';
import { BookCover } from './BookCover';

interface BookDetailDrawerProps {
  book: Audiobook | null;
  onClose: () => void;
}

export function BookDetailDrawer({ book, onClose }: BookDetailDrawerProps) {
  const { isBookSaved, toggleSaveBook, progressMap } = useAuth();
  const {
    activeBook,
    currentChapterIndex,
    isPlaying,
    playBook,
    togglePlayPause,
    openFullPlayer,
  } = useAudioPlayer();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [loadingChapters, setLoadingChapters] = useState(false);

  useEffect(() => {
    if (!book) return;
    setChapters(book.chapters);
    setTotalDuration(book.totalDurationSeconds);

    if (book.archiveId && !book.chaptersPrebaked && book.chapters.length <= 4) {
      let active = true;
      setLoadingChapters(true);
      fetchFullBookChapters(book.archiveId)
        .then((remote) => {
          if (!active || !remote) return;
          if (remote.length > book.chapters.length) {
            setChapters(remote);
            const sum = remote.reduce((acc, c) => acc + c.durationSeconds, 0);
            if (sum > 0) setTotalDuration(sum);
          }
        })
        .finally(() => {
          if (active) setLoadingChapters(false);
        });
      return () => {
        active = false;
      };
    }
  }, [book]);

  useEffect(() => {
    if (!book) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [book, onClose]);

  if (!book) return null;

  const enrichedBook: Audiobook = {
    ...book,
    chapters: chapters.length > 0 ? chapters : book.chapters,
    totalDurationSeconds: totalDuration || book.totalDurationSeconds,
  };

  const saved = isBookSaved(book.id);
  const progress = progressMap[book.id];
  const isCurrentBook = activeBook?.id === book.id;

  const handlePrimaryPlay = () => {
    if (isCurrentBook) {
      if (!isPlaying) {
        togglePlayPause();
        openFullPlayer();
        onClose();
      } else {
        togglePlayPause();
      }
    } else {
      playBook(enrichedBook);
      onClose();
    }
  };

  const handlePlayChapter = (index: number) => {
    playBook(enrichedBook, index, 0);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        {/* Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Sheet / Modal */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={book.title}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[#13161D] ring-1 ring-white/10 sm:rounded-3xl"
        >
          {/* Mobile drag handle */}
          <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-2 sm:px-6 sm:pt-5">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="hidden text-xs font-medium text-[#8C93A1] sm:block">
              {book.edition}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close book details"
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-full text-[#C2C7D0] transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto px-5 pb-8 sm:px-7">
            {/* Header Info */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              <div className="mx-auto w-36 shrink-0 sm:mx-0 sm:w-40">
                <BookCover
                  title={book.title}
                  author={book.author}
                  coverUrl={book.coverUrl}
                  accentColor={book.coverAccent}
                  progressFraction={
                    progress && enrichedBook.totalDurationSeconds > 0
                      ? progress.totalElapsedSeconds / enrichedBook.totalDurationSeconds
                      : undefined
                  }
                />
              </div>

              <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-balance text-[#F4F1EA] sm:text-3xl">
                  {book.title}
                </h2>
                <p className="mt-1 text-sm font-medium text-[#D5D9E0]">
                  {book.author}
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-[#8C93A1] sm:justify-start">
                  <span>{book.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>Narrated by {book.narrator}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    {formatDurationCompact(enrichedBook.totalDurationSeconds)}
                  </span>
                </div>

                <div className="mt-5 flex w-full flex-wrap items-center gap-3 sm:w-auto">
                  <button
                    type="button"
                    onClick={handlePrimaryPlay}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#E5A93C] px-5 py-2.5 text-sm font-semibold text-[#0B0D11] transition-colors hover:bg-[#EEB854] active:scale-[0.98] sm:flex-initial whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
                  >
                    {isCurrentBook && isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                        <span>
                          {progress && progress.totalElapsedSeconds > 5
                            ? `Resume Ch. ${progress.chapterIndex + 1}`
                            : 'Listen Now'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSaveBook(enrichedBook)}
                    className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                      saved
                        ? 'bg-[#E5A93C]/15 text-[#E5A93C] ring-[#E5A93C]/40'
                        : 'bg-white/[0.06] text-[#F4F1EA] ring-white/10 hover:bg-white/[0.1]'
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4" aria-hidden="true" />
                        <span>Save to Library</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div className="mt-6 border-t border-white/[0.08] pt-5">
              <h3 className="text-xs font-semibold tracking-wide text-[#8C93A1]">
                Synopsis
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#C2C7D0]">
                {book.synopsis}
              </p>
            </div>

            {/* Chapter Tracklist */}
            <div className="mt-6 border-t border-white/[0.08] pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-[#8C93A1]">
                  Chapters ({enrichedBook.chapters.length})
                </h3>
                {loadingChapters && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#8C93A1]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Loading full tracklist</span>
                  </span>
                )}
              </div>

              <div className="mt-3 divide-y divide-white/[0.06]">
                {enrichedBook.chapters.map((chapter, idx) => {
                  const isActiveChapter =
                    isCurrentBook && currentChapterIndex === idx;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => handlePlayChapter(idx)}
                      className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                        isActiveChapter ? 'bg-[#E5A93C]/10' : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`font-mono-tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs ${
                            isActiveChapter
                              ? 'bg-[#E5A93C] font-semibold text-[#0B0D11]'
                              : 'bg-white/[0.05] text-[#8C93A1]'
                          }`}
                        >
                          {isActiveChapter && isPlaying ? (
                            <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <span
                          className={`truncate text-sm ${
                            isActiveChapter
                              ? 'font-semibold text-[#E5A93C]'
                              : 'font-medium text-[#E8E6DF]'
                          }`}
                        >
                          {chapter.title}
                        </span>
                      </div>
                      <span className="font-mono-tabular shrink-0 text-xs text-[#8C93A1]">
                        {formatTimestamp(chapter.durationSeconds)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
