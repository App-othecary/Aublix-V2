import { BookOpen } from 'lucide-react';
import { useState } from 'react';

interface BookCoverProps {
  title: string;
  author: string;
  coverUrl?: string;
  accentColor?: string;
  progressFraction?: number;
  className?: string;
  priority?: boolean;
}

export function BookCover({
  title,
  author,
  coverUrl,
  accentColor = '#8B6F3E',
  progressFraction,
  className = '',
  priority = false,
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
      ) : (
        <div
          className="flex h-full w-full flex-col justify-between p-4 text-[#F4F1EA]"
          style={{
            background: `linear-gradient(155deg, ${accentColor}38 0%, #151821 55%, #0D0F14 100%)`,
          }}
        >
          <div className="flex items-center justify-between border-b border-white/15 pb-2">
            <span className="text-[10px] font-medium tracking-wider text-white/60 uppercase">
              Public Domain
            </span>
            <BookOpen className="h-3.5 w-3.5 text-white/50" aria-hidden="true" />
          </div>
          <div className="my-auto py-2">
            <p className="font-display text-base leading-snug font-semibold text-[#F4F1EA] line-clamp-4">
              {title}
            </p>
          </div>
          <div className="border-t border-white/15 pt-2">
            <p className="truncate text-xs text-white/70">{author}</p>
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
