export type GenreCategory =
  | 'All'
  | 'Classics'
  | 'Mystery & Gothic'
  | 'Philosophy'
  | 'Sci-Fi & Fantasy'
  | 'Under 3 Hours';

export interface Chapter {
  id: string;
  index: number;
  title: string;
  durationSeconds: number;
  audioUrl: string;
}

export interface Audiobook {
  id: string;
  archiveId: string;
  title: string;
  author: string;
  narrator: string;
  edition: string;
  year: number;
  genre: Exclude<GenreCategory, 'All' | 'Under 3 Hours'>;
  synopsis: string;
  coverUrl: string;
  coverAccent: string;
  totalDurationSeconds: number;
  chapters: Chapter[];
  featured?: boolean;
  source: 'curated' | 'librivox';
  chaptersPrebaked?: boolean;
}

export interface ListeningProgress {
  bookId: string;
  chapterIndex: number;
  chapterTitle: string;
  positionSeconds: number;
  chapterDurationSeconds: number;
  totalElapsedSeconds: number;
  totalBookDurationSeconds: number;
  playbackSpeed: number;
  completed: boolean;
  lastListenedAt: string;
  bookSnapshot?: Audiobook;
}

export interface SavedBook {
  bookId: string;
  savedAt: string;
  bookSnapshot: Audiobook;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  authProvider: 'supabase' | 'local';
}

export type PlaybackSpeed = 1 | 1.25 | 1.5 | 2;

export type SleepTimerMode = 'off' | '15m' | '30m' | 'end_of_chapter';
