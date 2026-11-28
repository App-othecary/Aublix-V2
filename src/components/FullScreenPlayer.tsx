import {
  Bookmark,
  Check,
  ChevronDown,
  ListMusic,
  Loader2,
  Moon,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { formatRemaining, formatTimestamp } from '../lib/format';
import { PlaybackSpeed, SleepTimerMode } from '../types/audiobook';
import { BookCover } from './BookCover';

const SPEED_OPTIONS: PlaybackSpeed[] = [1, 1.25, 1.5, 2];

const SLEEP_OPTIONS: Array<{ value: SleepTimerMode; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: 'end_of_chapter', label: 'End of Chapter' },
];

export function FullScreenPlayer() {
  const {
    activeBook,
    currentChapterIndex,
    currentChapter,
    isPlaying,
    isBuffering,
    audioError,
    currentTime,
    duration,
    playbackSpeed,
    sleepTimerMode,
    sleepRemainingSeconds,
    isFullPlayerOpen,
    togglePlayPause,
    seekTo,
    skipBackward15,
    skipForward30,
    selectChapter,
    nextChapter,
    previousChapter,
    setPlaybackSpeed,
    setSleepTimerMode,
    closeFullPlayer,
  } = useAudioPlayer();

  const { isBookSaved, toggleSaveBook } = useAuth();
  const [showChapterList, setShowChapterList] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  useEffect(() => {
    if (!isFullPlayerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFullPlayer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullPlayerOpen, closeFullPlayer]);

  if (!activeBook || !currentChapter) return null;

  const saved = isBookSaved(activeBook.id);
  const effectiveDuration = duration || currentChapter.durationSeconds || 1;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTime / effectiveDuration) * 100)
  );

  return (
    <AnimatePresence>
      {isFullPlayerOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Full screen audiobook player"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[#0B0D11] text-[#F4F1EA]"
        >
          {/* Subtle Cover Glow */}
          {activeBook.coverUrl && (
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
              <img
                src={activeBook.coverUrl}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="h-full w-full scale-125 object-cover opacity-20 blur-3xl"
              />
              <div className="absolute inset-0 bg-[#0B0D11]/80" />
            </div>
          )}

          {/* Header Bar */}
          <header className="relative z-10 mx-auto flex w-full max-w-2xl shrink-0 items-center justify-between px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
            <button
              type="button"
              onClick={closeFullPlayer}
              aria-label="Minimize player"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-[#F4F1EA] transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
            >
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="text-center">
              <p className="text-xs font-medium text-[#9BA1AE]">Now Listening</p>
              <p className="max-w-[200px] truncate text-xs font-semibold text-[#F4F1EA]">
                {activeBook.author}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleSaveBook(activeBook)}
              aria-label={saved ? 'Remove from library' : 'Save to library'}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                saved
                  ? 'bg-[#E5A93C]/20 text-[#E5A93C]'
                  : 'bg-white/[0.06] text-[#F4F1EA] hover:bg-white/[0.12]'
              }`}
            >
              {saved ? (
                <Check className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Bookmark className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </header>

          {/* Main Player Content */}
          <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-between px-5 pt-3 pb-8 sm:px-6 sm:pb-10">
            {/* Cover Art */}
            <div className="my-auto flex flex-col items-center py-4">
              <div className="w-48 sm:w-60">
                <BookCover
                  title={activeBook.title}
                  author={activeBook.author}
                  coverUrl={activeBook.coverUrl}
                  accentColor={activeBook.coverAccent}
                  className="rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)]"
                />
              </div>

              {/* Book & Chapter Selector */}
              <div className="mt-6 w-full text-center">
                <h2 className="font-display text-xl font-semibold text-balance text-[#F4F1EA] sm:text-2xl">
                  {activeBook.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowChapterList((v) => !v)}
                  className="mx-auto mt-2 inline-flex min-h-[40px] max-w-full items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-[#C2C7D0] ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
                >
                  <ListMusic className="h-3.5 w-3.5 shrink-0 text-[#E5A93C]" aria-hidden="true" />
                  <span className="truncate">{currentChapter.title}</span>
                  <span className="font-mono-tabular shrink-0 text-[#8C93A1]">
                    ({currentChapterIndex + 1}/{activeBook.chapters.length})
                  </span>
                </button>
              </div>

              {/* Inline Chapter Picker Drawer */}
              {showChapterList && (
                <div className="mt-4 max-h-48 w-full overflow-y-auto rounded-2xl bg-[#13161D] p-2 ring-1 ring-white/10">
                  {activeBook.chapters.map((ch, idx) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        selectChapter(idx);
                        setShowChapterList(false);
                      }}
                      className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        idx === currentChapterIndex
                          ? 'bg-[#E5A93C]/15 font-semibold text-[#E5A93C]'
                          : 'text-[#C2C7D0] hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="truncate">{ch.title}</span>
                      <span className="font-mono-tabular shrink-0 text-[#8C93A1]">
                        {formatTimestamp(ch.durationSeconds)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {audioError && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 ring-1 ring-red-500/25"
                >
                  {audioError}
                </p>
              )}
            </div>

            {/* Scrubber & Primary Audiobook Controls */}
            <div className="space-y-6">
              {/* Scrubber Timeline */}
              <div>
                <input
                  type="range"
                  aria-label="Seek audiobook position"
                  min={0}
                  max={effectiveDuration}
                  step={1}
                  value={Math.min(currentTime, effectiveDuration)}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="audio-scrubber w-full"
                  style={{
                    background: `linear-gradient(to right, #E5A93C ${progressPercent}%, rgba(255,255,255,0.16) ${progressPercent}%)`,
                    height: '4px',
                    borderRadius: '9999px',
                  }}
                />
                <div className="font-mono-tabular mt-2 flex items-center justify-between text-xs text-[#9BA1AE]">
                  <span>{formatTimestamp(currentTime)}</span>
                  <span>{formatRemaining(currentTime, effectiveDuration)}</span>
                </div>
              </div>

              {/* Audiobook Playback Controls */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={previousChapter}
                  aria-label="Previous chapter"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[#C2C7D0] transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
                >
                  <SkipBack className="h-5 w-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={skipBackward15}
                  aria-label="Rewind 15 seconds"
                  className="relative flex h-14 w-14 flex-col items-center justify-center rounded-full text-[#F4F1EA] transition-colors hover:bg-white/[0.08] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
                >
                  <RotateCcw className="h-6 w-6" aria-hidden="true" />
                  <span className="font-mono-tabular mt-0.5 text-[10px] font-semibold">
                    15
                  </span>
                </button>

                <button
                  type="button"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E5A93C] text-[#0B0D11] shadow-xl shadow-[#E5A93C]/20 transition-transform hover:bg-[#EEB854] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
                >
                  {isBuffering ? (
                    <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                  ) : isPlaying ? (
                    <Pause className="h-7 w-7 fill-current" aria-hidden="true" />
                  ) : (
                    <Play className="h-7 w-7 fill-current translate-x-0.5" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={skipForward30}
                  aria-label="Forward 30 seconds"
                  className="relative flex h-14 w-14 flex-col items-center justify-center rounded-full text-[#F4F1EA] transition-colors hover:bg-white/[0.08] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
                >
                  <RotateCw className="h-6 w-6" aria-hidden="true" />
                  <span className="font-mono-tabular mt-0.5 text-[10px] font-semibold">
                    30
                  </span>
                </button>

                <button
                  type="button"
                  onClick={nextChapter}
                  disabled={currentChapterIndex >= activeBook.chapters.length - 1}
                  aria-label="Next chapter"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[#C2C7D0] transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
                >
                  <SkipForward className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Speed & Sleep Timer Utility Strip */}
              <div className="relative flex items-center justify-between gap-3 rounded-2xl bg-[#13161D] p-2 ring-1 ring-white/[0.08]">
                {/* Speed Segmented Selector */}
                <div className="flex items-center gap-1" role="group" aria-label="Playback speed">
                  {SPEED_OPTIONS.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`font-mono-tabular min-h-[40px] rounded-xl px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                        playbackSpeed === spd
                          ? 'bg-[#E5A93C] font-semibold text-[#0B0D11]'
                          : 'text-[#9BA1AE] hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Sleep Timer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSleepMenu((v) => !v)}
                  className={`flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#E5A93C] ${
                    sleepTimerMode !== 'off'
                      ? 'bg-[#E5A93C]/20 text-[#E5A93C] ring-1 ring-[#E5A93C]/40'
                      : 'text-[#C2C7D0] hover:bg-white/[0.06]'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-mono-tabular">
                    {sleepTimerMode === 'off'
                      ? 'Sleep'
                      : sleepTimerMode === 'end_of_chapter'
                        ? 'End of Ch.'
                        : sleepRemainingSeconds !== null
                          ? formatTimestamp(sleepRemainingSeconds)
                          : sleepTimerMode}
                  </span>
                </button>

                {showSleepMenu && (
                  <div className="absolute right-0 bottom-14 z-20 w-48 rounded-2xl bg-[#181C25] p-1.5 shadow-2xl ring-1 ring-white/15">
                    <p className="px-3 py-1.5 text-[11px] font-medium text-[#8C93A1]">
                      Sleep Timer
                    </p>
                    {SLEEP_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSleepTimerMode(opt.value);
                          setShowSleepMenu(false);
                        }}
                        className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 text-left text-xs transition-colors ${
                          sleepTimerMode === opt.value
                            ? 'bg-[#E5A93C]/15 font-semibold text-[#E5A93C]'
                            : 'text-[#E8E6DF] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sleepTimerMode === opt.value && (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
