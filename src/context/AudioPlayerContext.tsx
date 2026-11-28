import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchFullBookChapters } from '../lib/catalog';
import {
  Audiobook,
  Chapter,
  PlaybackSpeed,
  SleepTimerMode,
} from '../types/audiobook';
import { useAuth } from './AuthContext';

interface AudioPlayerContextValue {
  activeBook: Audiobook | null;
  currentChapterIndex: number;
  currentChapter: Chapter | null;
  isPlaying: boolean;
  isBuffering: boolean;
  audioError: string | null;
  currentTime: number;
  duration: number;
  playbackSpeed: PlaybackSpeed;
  sleepTimerMode: SleepTimerMode;
  sleepRemainingSeconds: number | null;
  isFullPlayerOpen: boolean;
  playBook: (
    book: Audiobook,
    chapterIndex?: number,
    startSeconds?: number
  ) => Promise<void>;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  skipBackward15: () => void;
  skipForward30: () => void;
  selectChapter: (index: number) => void;
  nextChapter: () => void;
  previousChapter: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  cyclePlaybackSpeed: () => void;
  setSleepTimerMode: (mode: SleepTimerMode) => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

const SPEED_OPTIONS: PlaybackSpeed[] = [1, 1.25, 1.5, 2];

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const { user, progressMap, upsertProgress } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeBook, setActiveBook] = useState<Audiobook | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1);
  const [sleepTimerMode, setSleepTimerModeState] = useState<SleepTimerMode>('off');
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

  const pendingSeekRef = useRef<number | null>(null);
  const lastSyncRef = useRef<number>(0);

  const currentChapter = useMemo(() => {
    if (!activeBook || activeBook.chapters.length === 0) return null;
    return activeBook.chapters[currentChapterIndex] || activeBook.chapters[0];
  }, [activeBook, currentChapterIndex]);

  const computeTotalElapsed = useCallback(
    (book: Audiobook, chIndex: number, chTime: number) => {
      const priorSeconds = book.chapters
        .slice(0, chIndex)
        .reduce((acc, ch) => acc + (ch.durationSeconds || 0), 0);
      return priorSeconds + chTime;
    },
    []
  );

  const syncProgressNow = useCallback(
    (
      book: Audiobook | null,
      chIdx: number,
      posSeconds: number,
      chDuration: number,
      completed = false
    ) => {
      if (!user || !book) return;
      const ch = book.chapters[chIdx];
      if (!ch) return;
      const totalElapsed = computeTotalElapsed(book, chIdx, posSeconds);
      upsertProgress({
        bookId: book.id,
        chapterIndex: chIdx,
        chapterTitle: ch.title,
        positionSeconds: posSeconds,
        chapterDurationSeconds: chDuration || ch.durationSeconds,
        totalElapsedSeconds: totalElapsed,
        totalBookDurationSeconds: book.totalDurationSeconds,
        playbackSpeed,
        completed,
        bookSnapshot: book,
      });
    },
    [user, computeTotalElapsed, upsertProgress, playbackSpeed]
  );

  // Initialize single persistent HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Load chapter audio source when book or chapter changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter) return;

    setAudioError(null);
    setIsBuffering(true);
    audio.src = currentChapter.audioUrl;
    audio.playbackRate = playbackSpeed;
    audio.load();

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
    }
  }, [currentChapter?.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep playbackRate synced
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Attach audio lifecycle event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      const metaDur = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(metaDur || currentChapter?.durationSeconds || 0);
      if (pendingSeekRef.current !== null) {
        const target = Math.min(
          Math.max(0, pendingSeekRef.current),
          metaDur > 0 ? metaDur - 1 : pendingSeekRef.current
        );
        audio.currentTime = target;
        setCurrentTime(target);
        pendingSeekRef.current = null;
      }
      setIsBuffering(false);
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      setAudioError(null);
    };

    const onPause = () => {
      setIsPlaying(false);
      if (activeBook) {
        syncProgressNow(
          activeBook,
          currentChapterIndex,
          audio.currentTime,
          audio.duration || currentChapter?.durationSeconds || 0
        );
      }
    };

    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);

    const onTimeUpdate = () => {
      const pos = audio.currentTime;
      setCurrentTime(pos);
      const now = Date.now();
      if (activeBook && now - lastSyncRef.current > 25000) {
        lastSyncRef.current = now;
        syncProgressNow(
          activeBook,
          currentChapterIndex,
          pos,
          audio.duration || currentChapter?.durationSeconds || 0
        );
      }
    };

    const onEnded = () => {
      if (!activeBook) return;
      if (sleepTimerMode === 'end_of_chapter') {
        setIsPlaying(false);
        setSleepTimerModeState('off');
        setSleepRemainingSeconds(null);
        return;
      }

      const nextIdx = currentChapterIndex + 1;
      if (nextIdx < activeBook.chapters.length) {
        pendingSeekRef.current = 0;
        setCurrentChapterIndex(nextIdx);
        setCurrentTime(0);
      } else {
        setIsPlaying(false);
        syncProgressNow(
          activeBook,
          currentChapterIndex,
          audio.duration || currentChapter?.durationSeconds || 0,
          audio.duration || currentChapter?.durationSeconds || 0,
          true
        );
      }
    };

    const onError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setAudioError('Unable to stream this track right now. Tap play to retry.');
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [activeBook, currentChapterIndex, currentChapter, sleepTimerMode, syncProgressNow]);

  // Sleep Timer countdown interval
  useEffect(() => {
    if (sleepTimerMode !== '15m' && sleepTimerMode !== '30m') {
      return;
    }
    const timer = window.setInterval(() => {
      setSleepRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          audioRef.current?.pause();
          setIsPlaying(false);
          setSleepTimerModeState('off');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [sleepTimerMode]);

  const playBook = useCallback(
    async (book: Audiobook, chapterIndex?: number, startSeconds?: number) => {
      const savedProg = progressMap[book.id];
      const targetChapterIdx =
        typeof chapterIndex === 'number'
          ? chapterIndex
          : savedProg
            ? savedProg.chapterIndex
            : 0;
      const targetPos =
        typeof startSeconds === 'number'
          ? startSeconds
          : typeof chapterIndex === 'number'
            ? 0
            : savedProg
              ? savedProg.positionSeconds
              : 0;

      // If same book and same chapter, just seek & play
      if (
        activeBook?.id === book.id &&
        currentChapterIndex === targetChapterIdx &&
        audioRef.current
      ) {
        if (typeof startSeconds === 'number') {
          audioRef.current.currentTime = startSeconds;
          setCurrentTime(startSeconds);
        }
        audioRef.current.play().catch(() => {});
        setIsFullPlayerOpen(true);
        return;
      }

      pendingSeekRef.current = targetPos;
      setActiveBook(book);
      setCurrentChapterIndex(Math.min(targetChapterIdx, Math.max(0, book.chapters.length - 1)));
      setCurrentTime(targetPos);
      setDuration(book.chapters[targetChapterIdx]?.durationSeconds || 0);
      setIsFullPlayerOpen(true);

      // Enrich full chapter list only when not already pre-baked into the catalog
      if (book.archiveId && !book.chaptersPrebaked && book.chapters.length <= 4) {
        fetchFullBookChapters(book.archiveId).then((remoteChapters) => {
          if (remoteChapters && remoteChapters.length > book.chapters.length) {
            const totalDurationSeconds = remoteChapters.reduce(
              (sum, ch) => sum + ch.durationSeconds,
              0
            );
            setActiveBook((curr) =>
              curr && curr.id === book.id
                ? { ...curr, chapters: remoteChapters, totalDurationSeconds }
                : curr
            );
          }
        });
      }
    },
    [activeBook?.id, currentChapterIndex, progressMap]
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter) return;

    if (audio.paused) {
      setAudioError(null);
      if (audio.error) {
        audio.load();
      }
      audio.play().catch(() => {
        setAudioError('Playback blocked or unavailable. Tap again to retry.');
      });
    } else {
      audio.pause();
    }
  }, [currentChapter]);

  const seekTo = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const maxDur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
      const clamped = Math.max(0, Math.min(seconds, maxDur || seconds));
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration]
  );

  const skipBackward15 = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime - 15);
  }, [seekTo]);

  const skipForward30 = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime + 30);
  }, [seekTo]);

  const selectChapter = useCallback(
    (index: number) => {
      if (!activeBook) return;
      if (index < 0 || index >= activeBook.chapters.length) return;
      pendingSeekRef.current = 0;
      setCurrentChapterIndex(index);
      setCurrentTime(0);
      setDuration(activeBook.chapters[index].durationSeconds || 0);
    },
    [activeBook]
  );

  const nextChapter = useCallback(() => {
    if (!activeBook) return;
    if (currentChapterIndex + 1 < activeBook.chapters.length) {
      selectChapter(currentChapterIndex + 1);
    }
  }, [activeBook, currentChapterIndex, selectChapter]);

  const previousChapter = useCallback(() => {
    if (!activeBook) return;
    if (currentTime > 5) {
      seekTo(0);
      return;
    }
    if (currentChapterIndex > 0) {
      selectChapter(currentChapterIndex - 1);
    }
  }, [activeBook, currentTime, currentChapterIndex, seekTo, selectChapter]);

  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeedState(speed);
  }, []);

  const cyclePlaybackSpeed = useCallback(() => {
    setPlaybackSpeedState((curr) => {
      const idx = SPEED_OPTIONS.indexOf(curr);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, []);

  const setSleepTimerMode = useCallback((mode: SleepTimerMode) => {
    setSleepTimerModeState(mode);
    if (mode === '15m') {
      setSleepRemainingSeconds(15 * 60);
    } else if (mode === '30m') {
      setSleepRemainingSeconds(30 * 60);
    } else {
      setSleepRemainingSeconds(null);
    }
  }, []);

  const openFullPlayer = useCallback(() => setIsFullPlayerOpen(true), []);
  const closeFullPlayer = useCallback(() => setIsFullPlayerOpen(false), []);

  return (
    <AudioPlayerContext.Provider
      value={{
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
        playBook,
        togglePlayPause,
        seekTo,
        skipBackward15,
        skipForward30,
        selectChapter,
        nextChapter,
        previousChapter,
        setPlaybackSpeed,
        cyclePlaybackSpeed,
        setSleepTimerMode,
        openFullPlayer,
        closeFullPlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used inside AudioPlayerProvider');
  return ctx;
}
