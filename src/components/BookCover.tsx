import { useState } from 'react';

interface BookCoverProps {
  title: string;
  author: string;
  coverUrl?: string;
  accentColor?: string;
  progressFraction?: number;
  className?: string;
  priority?: boolean;
  compact?: boolean;
}

export function BookCover({
  title,
  author,
  coverUrl,
  accentColor = '#6E2B2E',
  progressFraction,
  className = '',
  priority = false,
  compact = false,
}: BookCoverProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(coverUrl) && !imgError;

  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#161922] shadow-[0_12px_28px_-10px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.08] ${className}`}
    >
      {showImage ? (
        <img
          src={coverUrl}
          alt={`${title} by ${author}`}
          referrerPolicy="no-referrer"
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      ) : compact ? (
        <div
          className="flex h-full w-full items-center justify-center p-1"
          style={{
            background: `radial-gradient(circle at 70% 25%, ${accentColor}99 0%, #11131A 100%)`,
          }}
        >
          <span className="font-display text-xs font-semibold text-[#F7F3E9]">
            {title.slice(0, 1)}
          </span>
        </div>
      ) : (
        <div
          className="relative flex h-full w-full flex-col justify-between overflow-hidden p-3.5 text-[#F4F1EA]"
          style={{
            background: `radial-gradient(circle at 72% 24%, ${accentColor}99 0%, ${accentColor}45 42%, #11131A 100%)`,
          }}
        >
          {/* Subtle cloth-spine shading along the left edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/45 via-black/15 to-transparent"
          />

          {/* Foil-ruled inner frame */}
          <div className="relative flex h-full w-full flex-col justify-between rounded-md border border-[#E5A93C]/25 px-2.5 py-2.5">
            {/* Top Ornament & Edition Label */}
            <div className="flex flex-col items-center gap-1.5 border-b border-[#E5A93C]/20 pb-2 text-center">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-[#E5A93C]/80"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M12 3l2.2 5.4L20 10l-5.8 1.6L12 17l-2.2-5.4L4 10l5.8-1.6L12 3z" />
              </svg>
              <span className="text-[9px] font-medium tracking-[0.14em] text-[#E8DFC8]/70 uppercase">
                Unabridged
              </span>
            </div>

            {/* Center Editorial Title */}
            <div className="my-auto py-1.5 text-center">
              <p className="font-display text-[13px] leading-snug font-semibold text-balance text-[#F7F3E9] line-clamp-4 sm:text-[15px]">
                {title}
              </p>
            </div>

            {/* Bottom Author Block */}
            <div className="border-t border-[#E5A93C]/20 pt-2 text-center">
              <p className="truncate text-[11px] font-medium text-[#DED6C3]/80">
                {author}
              </p>
            </div>
          </div>
        </div>
      )}

      {typeof progressFraction === 'number' && progressFraction > 0 && (
        <div
          className="absolute right-0 bottom-0 left-0 h-1 bg-black/60"
          aria-label={`${Math.round(progressFraction * 100)}% listened`}
        >
          <div
            className="h-full bg-[#E5A93C] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(4, progressFraction * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}
