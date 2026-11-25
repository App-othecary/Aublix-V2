import { Loader2, Mail, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function AuthModal() {
  const {
    authModalOpen,
    authPromptReason,
    closeAuthModal,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    isSupabaseMode,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithPassword(email, password);
        if (res.error) setErrorMsg(res.error);
      } else if (mode === 'signup') {
        const res = await signUpWithPassword(email, password, displayName);
        if (res.error) setErrorMsg(res.error);
        if (res.notice) setNoticeMsg(res.notice);
      } else {
        const res = await signInWithMagicLink(email);
        if (res.error) setErrorMsg(res.error);
        if (res.notice) setNoticeMsg(res.notice);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          aria-hidden="true"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Account sign in"
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md rounded-t-3xl bg-[#13161D] p-6 ring-1 ring-white/10 sm:rounded-3xl sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#F4F1EA]">
                {mode === 'signup' ? 'Create Account' : 'Sign In to Aublix'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#9BA1AE]">
                {authPromptReason ||
                  'Sync your saved library and exact listening timestamps across sessions.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Close sign in dialog"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#9BA1AE] transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-[#E5A93C]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Auth Mode Switcher */}
          <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-[#0B0D11] p-1 ring-1 ring-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setNoticeMsg(null);
              }}
              className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'signin'
                  ? 'bg-[#1D222D] text-[#F4F1EA]'
                  : 'text-[#8C93A1] hover:text-[#F4F1EA]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setNoticeMsg(null);
              }}
              className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'signup'
                  ? 'bg-[#1D222D] text-[#F4F1EA]'
                  : 'text-[#8C93A1] hover:text-[#F4F1EA]'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('magic');
                setErrorMsg(null);
                setNoticeMsg(null);
              }}
              className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'magic'
                  ? 'bg-[#1D222D] text-[#F4F1EA]'
                  : 'text-[#8C93A1] hover:text-[#F4F1EA]'
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-display-name"
                  className="block text-xs font-medium text-[#C2C7D0]"
                >
                  Display Name
                </label>
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Reader Name"
                  className="mt-1.5 h-11 w-full rounded-xl bg-[#0B0D11] px-3.5 text-sm text-[#F4F1EA] ring-1 ring-white/10 placeholder:text-[#5F6673] focus:ring-[#E5A93C] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-[#C2C7D0]"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 h-11 w-full rounded-xl bg-[#0B0D11] px-3.5 text-sm text-[#F4F1EA] ring-1 ring-white/10 placeholder:text-[#5F6673] focus:ring-[#E5A93C] focus:outline-none"
              />
            </div>

            {mode !== 'magic' && (
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-[#C2C7D0]"
                >
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1.5 h-11 w-full rounded-xl bg-[#0B0D11] px-3.5 text-sm text-[#F4F1EA] ring-1 ring-white/10 placeholder:text-[#5F6673] focus:ring-[#E5A93C] focus:outline-none"
                />
              </div>
            )}

            {errorMsg && (
              <p
                role="alert"
                className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 ring-1 ring-red-500/25"
              >
                {errorMsg}
              </p>
            )}

            {noticeMsg && (
              <p className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300 ring-1 ring-emerald-500/25">
                {noticeMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E5A93C] text-sm font-semibold text-[#0B0D11] transition-colors hover:bg-[#EEB854] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A93C]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : mode === 'magic' ? (
                <>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>Send Magic Link</span>
                </>
              ) : mode === 'signup' ? (
                <span>Create Account</span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {!isSupabaseMode && (
            <p className="mt-4 text-center text-[11px] leading-relaxed text-[#7A818F]">
              Running with local server persistence. Connect Supabase keys in{' '}
              <span className="font-mono-tabular text-[#9BA1AE]">.env</span> for cloud sync.
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
