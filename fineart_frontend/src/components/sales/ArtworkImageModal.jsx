'use client';

import { useState } from 'react';

export default function ArtworkImageModal({ imageUrl, fallbackImage, title, description }) {
  const [open, setOpen] = useState(false);

  const src = imageUrl || fallbackImage;
  const shortDescription =
    description?.length > 200 ? `${description.slice(0, 200)}…` : description;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block w-full overflow-hidden rounded-[40px] border border-neutral-100 bg-neutral-50 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.45)]"
      >
        <img
          src={src}
          alt={title || '작품'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent px-6 pb-5 pt-16">
          <div>
            <p className="text-sm font-medium text-white">{title}</p>
            {shortDescription && (
              <p className="mt-1 line-clamp-1 text-xs text-white/70">{shortDescription}</p>
            )}
          </div>
          <span className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-semibold text-neutral-900 shadow">
            +
          </span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-900 to-slate-900 shadow-[0_40px_140px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-xs font-semibold text-white shadow hover:bg-black/80"
            >
              ✕
            </button>
            <div className="grid gap-0 md:grid-cols-[3fr,2fr]">
              <div className="relative bg-black">
                <img
                  src={src}
                  alt={title || '작품'}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-4 p-6 md:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-neutral-400">
                  FineArt · Artwork
                </p>
                <h2 className="text-2xl font-semibold text-white md:text-3xl">{title}</h2>
                {description && (
                  <p className="text-sm leading-relaxed text-neutral-300">{description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

