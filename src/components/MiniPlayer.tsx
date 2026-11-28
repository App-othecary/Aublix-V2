import { ChevronUp, Loader2, Pause, Play, RotateCw } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { BookCover } from './BookCover';

export function MiniPlayer() {
  const {
    activeBook,
    currentChapter,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    togglePlayPause,
    skipForward30,
    openFullPlayer,
  } = useAudioPlayer();

  if (!activeBook || !currentChapter) return null;

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      className="fixed right-0 bottom-16 left-0 z-30 border-t border-white/[0.08] bg-[#13161D]/95 backdrop-blur-lg md:bottom-0 md:border-t"
      role="region"
      aria-label="Audio mini player"
    >
      {/* Thin top progress line */}
      <div className="h-[2px] w-full bg-white/[0.08]">
        <div
          className="h-full bg-[#E5A93C] transition-[width] duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
        {/* Tap info zone to expand full-screen player */}
        <button
          type="button"
          onClick={openFullPlayer}
          className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
          aria-label="Expand full screen audio player"
        >
          <div className="w-8 shrink-0">
            <BookCover
              title={activeBook.title}
              author={activeBook.author}
              coverUrl={activeBook.coverUrl}
              accentColor={activeBook.coverAccent}
              compact
              className="rounded-md"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#F4F1EA]">
              {activeBook.title}
            </p>
            <p className="truncate text-xs text-[#9BA1AE]">
              {currentChapter.title}
            </p>
          </div>
        </button>

        {/* Playback Controls */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={skipForward30}
            aria-label="Forward 30 seconds"
            className="hidden h-11 w-11 items-center justify-center rounded-full text-[#C2C7D0] transition-colors hover:bg-white/[0.08] hover:text-white sm:flex focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause audiobook' : 'Play audiobook'}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E5A93C] text-[#0B0D11] transition-transform hover:bg-[#EEB854] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
          >
            {isBuffering ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 fill-current translate-x-0.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={openFullPlayer}
            aria-label="Open full player"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#9BA1AE] transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
          >
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
