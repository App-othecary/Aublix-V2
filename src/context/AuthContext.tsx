import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  Audiobook,
  ListeningProgress,
  SavedBook,
  UserProfile,
} from '../types/audiobook';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthLoading: boolean;
  isSupabaseMode: boolean;
  savedBooks: SavedBook[];
  progressMap: Record<string, ListeningProgress>;
  continueListening: ListeningProgress[];
  isBookSaved: (bookId: string) => boolean;
  toggleSaveBook: (book: Audiobook) => Promise<void>;
  upsertProgress: (entry: Omit<ListeningProgress, 'lastListenedAt'>) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error?: string; notice?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string; notice?: string }>;
  signOut: () => Promise<void>;
  authModalOpen: boolean;
  authPromptReason: string | null;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ListeningProgress>>({});
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);

  const loadSupabaseUserData = useCallback(async (userId: string) => {
    if (!supabase) return;
    const [{ data: savedRows }, { data: progressRows }] = await Promise.all([
      supabase
        .from('saved_books')
        .select('book_id, saved_at, book_snapshot')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false }),
      supabase
        .from('listening_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_listened_at', { ascending: false }),
    ]);

    if (Array.isArray(savedRows)) {
      setSavedBooks(
        savedRows
          .filter((r) => r.book_snapshot)
          .map((r) => ({
            bookId: r.book_id,
            savedAt: r.saved_at,
            bookSnapshot: r.book_snapshot as Audiobook,
          }))
      );
    }

    if (Array.isArray(progressRows)) {
      const nextMap: Record<string, ListeningProgress> = {};
      for (const r of progressRows) {
        nextMap[r.book_id] = {
          bookId: r.book_id,
          chapterIndex: Number(r.chapter_index) || 0,
          chapterTitle: r.chapter_title || '',
          positionSeconds: Number(r.position_seconds) || 0,
          chapterDurationSeconds: Number(r.chapter_duration_seconds) || 0,
          totalElapsedSeconds: Number(r.total_elapsed_seconds) || 0,
          totalBookDurationSeconds: Number(r.total_book_duration_seconds) || 0,
          playbackSpeed: Number(r.playback_speed) || 1,
          completed: Boolean(r.completed),
          lastListenedAt: r.last_listened_at,
          bookSnapshot: r.book_snapshot as Audiobook | undefined,
        };
      }
      setProgressMap(nextMap);
    }
  }, []);

  const loadLocalUserData = useCallback(async (token: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [libRes, progRes] = await Promise.all([
        fetch('/api/library', { headers }),
        fetch('/api/progress', { headers }),
      ]);
      if (libRes.ok) {
        const libJson = (await libRes.json()) as { savedBooks?: SavedBook[] };
        if (Array.isArray(libJson.savedBooks)) {
          setSavedBooks(libJson.savedBooks);
        }
      }
      if (progRes.ok) {
        const progJson = (await progRes.json()) as { progress?: ListeningProgress[] };
        if (Array.isArray(progJson.progress)) {
          const nextMap: Record<string, ListeningProgress> = {};
          for (const p of progJson.progress) {
            nextMap[p.bookId] = p;
          }
          setProgressMap(nextMap);
        }
      }
    } catch {
      // Keep current state on transient network failure
    }
  }, []);

  // Initialize Supabase auth listener when configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        const email = session.user.email || '';
        setUser({
          id: session.user.id,
          email,
          displayName:
            (session.user.user_metadata?.display_name as string) ||
            email.split('@')[0] ||
            'Reader',
          authProvider: 'supabase',
        });
        loadSupabaseUserData(session.user.id);
      }
      setIsAuthLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        setUser({
          id: session.user.id,
          email,
          displayName:
            (session.user.user_metadata?.display_name as string) ||
            email.split('@')[0] ||
            'Reader',
          authProvider: 'supabase',
        });
        loadSupabaseUserData(session.user.id);
      } else {
        setUser(null);
        setSavedBooks([]);
        setProgressMap({});
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadSupabaseUserData]);

  const openAuthModal = useCallback((reason?: string) => {
    setAuthPromptReason(reason || null);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthPromptReason(null);
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        closeAuthModal();
        return {};
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as {
        token?: string;
        user?: UserProfile;
        error?: string;
      };
      if (!res.ok || !json.token || !json.user) {
        return { error: json.error || 'Unable to sign in.' };
      }
      setLocalToken(json.token);
      setUser(json.user);
      await loadLocalUserData(json.token);
      closeAuthModal();
      return {};
    },
    [closeAuthModal, loadLocalUserData]
  );

  const signUpWithPassword = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<{ error?: string; notice?: string }> => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split('@')[0] },
          },
        });
        if (error) return { error: error.message };
        if (!data.session) {
          return {
            notice: 'Check your email to confirm your account before signing in.',
          };
        }
        closeAuthModal();
        return {};
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      const json = (await res.json()) as {
        token?: string;
        user?: UserProfile;
        error?: string;
      };
      if (!res.ok || !json.token || !json.user) {
        return { error: json.error || 'Unable to create account.' };
      }
      setLocalToken(json.token);
      setUser(json.user);
      await loadLocalUserData(json.token);
      closeAuthModal();
      return {};
    },
    [closeAuthModal, loadLocalUserData]
  );

  const signInWithMagicLink = useCallback(
    async (email: string): Promise<{ error?: string; notice?: string }> => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) return { error: error.message };
        return { notice: `Magic sign-in link sent to ${email}.` };
      }

      return {
        error:
          'Magic Link emails require your Supabase project keys in .env. Please use Email & Password in preview mode.',
      };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setLocalToken(null);
    setUser(null);
    setSavedBooks([]);
    setProgressMap({});
  }, []);

  const isBookSaved = useCallback(
    (bookId: string) => savedBooks.some((b) => b.bookId === bookId),
    [savedBooks]
  );

  const toggleSaveBook = useCallback(
    async (book: Audiobook) => {
      if (!user) {
        openAuthModal(`Sign in to save "${book.title}" to your personal library.`);
        return;
      }

      const alreadySaved = savedBooks.some((b) => b.bookId === book.id);

      if (alreadySaved) {
        setSavedBooks((prev) => prev.filter((b) => b.bookId !== book.id));
        if (isSupabaseConfigured && supabase) {
          await supabase
            .from('saved_books')
            .delete()
            .eq('user_id', user.id)
            .eq('book_id', book.id);
        } else if (localToken) {
          await fetch(`/api/library/${encodeURIComponent(book.id)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localToken}` },
          });
        }
      } else {
        const newItem: SavedBook = {
          bookId: book.id,
          savedAt: new Date().toISOString(),
          bookSnapshot: book,
        };
        setSavedBooks((prev) => [newItem, ...prev.filter((b) => b.bookId !== book.id)]);

        if (isSupabaseConfigured && supabase) {
          await supabase.from('saved_books').upsert(
            {
              user_id: user.id,
              book_id: book.id,
              title: book.title,
              author: book.author,
              cover_url: book.coverUrl,
              genre: book.genre,
              total_duration_seconds: book.totalDurationSeconds,
              book_snapshot: book,
              saved_at: newItem.savedAt,
            },
            { onConflict: 'user_id,book_id' }
          );
        } else if (localToken) {
          await fetch('/api/library', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localToken}`,
            },
            body: JSON.stringify({ bookId: book.id, bookSnapshot: book }),
          });
        }
      }
    },
    [user, savedBooks, localToken, openAuthModal]
  );

  const upsertProgress = useCallback(
    async (entry: Omit<ListeningProgress, 'lastListenedAt'>) => {
      if (!user) return;
      const nowIso = new Date().toISOString();
      const fullEntry: ListeningProgress = {
        ...entry,
        lastListenedAt: nowIso,
      };

      setProgressMap((prev) => ({
        ...prev,
        [entry.bookId]: fullEntry,
      }));

      if (isSupabaseConfigured && supabase) {
        await supabase.from('listening_progress').upsert(
          {
            user_id: user.id,
            book_id: entry.bookId,
            chapter_index: entry.chapterIndex,
            chapter_title: entry.chapterTitle,
            position_seconds: entry.positionSeconds,
            chapter_duration_seconds: entry.chapterDurationSeconds,
            total_elapsed_seconds: entry.totalElapsedSeconds,
            total_book_duration_seconds: entry.totalBookDurationSeconds,
            playback_speed: entry.playbackSpeed,
            completed: entry.completed,
            book_snapshot: entry.bookSnapshot,
            last_listened_at: nowIso,
          },
          { onConflict: 'user_id,book_id' }
        );
      } else if (localToken) {
        await fetch('/api/progress', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localToken}`,
          },
          body: JSON.stringify(fullEntry),
        });
      }
    },
    [user, localToken]
  );

  const continueListening = useMemo(() => {
    return Object.values(progressMap)
      .filter((p) => p.bookSnapshot && !p.completed && p.totalElapsedSeconds > 2)
      .sort((a, b) => b.lastListenedAt.localeCompare(a.lastListenedAt));
  }, [progressMap]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        isSupabaseMode: isSupabaseConfigured,
        savedBooks,
        progressMap,
        continueListening,
        isBookSaved,
        toggleSaveBook,
        upsertProgress,
        signInWithPassword,
        signUpWithPassword,
        signInWithMagicLink,
        signOut,
        authModalOpen,
        authPromptReason,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
