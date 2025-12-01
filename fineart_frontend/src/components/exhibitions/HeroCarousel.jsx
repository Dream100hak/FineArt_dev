'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HeroCarousel({ slides }) {
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [mouseStartX, setMouseStartX] = useState(null);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const go = (delta) => {
    setIndex((prev) => (prev + delta + slides.length) % slides.length);
  };

  const applySwipe = (diff) => {
    if (Math.abs(diff) > 60) {
      go(diff > 0 ? -1 : 1);
    }
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;
    const diff = event.changedTouches[0].clientX - touchStartX;
    applySwipe(diff);
    setTouchStartX(null);
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0) return;
    setMouseStartX(event.clientX);
  };

  const handleMouseUp = (event) => {
    if (mouseStartX === null) return;
    const diff = event.clientX - mouseStartX;
    applySwipe(diff);
    setMouseStartX(null);
  };

  const handleMouseLeave = (event) => {
    if (mouseStartX === null) return;
    const diff = event.clientX - mouseStartX;
    applySwipe(diff);
    setMouseStartX(null);
  };

  const active = slides[index] ?? {};

  return (
    <section
      className="relative min-h-[90vh] cursor-grab select-none overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {active.image ? (
        <img
          src={active.image}
          alt={active.title ?? 'FineArt hero'}
          className="absolute inset-0 h-full w-full object-cover opacity-85"
          style={{ objectPosition: active.objectPosition ?? 'center center' }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/45" />

      <div className="relative mx-auto flex max-w-6xl flex-col justify-between gap-12 px-6 py-24 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6 rounded-[32px] bg-black/70 p-7 backdrop-blur-md shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
          <p className="text-xs uppercase tracking-[0.5em] text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.75)]">FineArt Curated</p>
          <h1 className="text-5xl font-semibold leading-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.8)]">
            {active.title ?? 'FineArt Digital Gallery'}
          </h1>
          <p className="text-sm uppercase tracking-[0.35em] text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.75)]">
            {active.period ?? 'Curating exhibitions · sales · rentals'}
          </p>
          <p className="text-base text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.75)]">
            {active.synopsis ??
              '작가와 컬렉터를 잇는 FineArt가 새로운 전시를 준비하고 있습니다. 컬렉션을 둘러보고 업데이트 소식을 받아보세요.'}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={active.cta?.href ?? '#'}
              className="rounded-full border border-white bg-white/90 px-7 py-2.5 text-sm font-semibold text-black shadow-lg shadow-black/50 transition hover:bg-white"
            >
              {active.cta?.label ?? '자세히 보기'}
            </Link>
            {active.infoCta && (
              <Link
                href={active.infoCta.href}
                className="rounded-full border border-white/60 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/40 transition hover:bg-white/10"
              >
                {active.infoCta.label}
              </Link>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4 rounded-[32px] border border-white/30 bg-black/65 p-6 backdrop-blur lg:w-auto shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.4em] text-white">Info</p>
          <div className="space-y-1 text-sm text-white">
            {active.info?.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          {active.infoCta && (
            <Link
              href={active.infoCta.href}
              className="text-sm font-semibold text-white underline-offset-4 hover:underline"
            >
              {active.infoCta.label}
            </Link>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex items-center justify-center gap-3">
            {slides.map((_, idx) => (
              <span
                key={`${active.title}-${idx}`}
                className={`inline-flex h-1.5 w-10 rounded-full transition ${
                  idx === index ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/40 bg-black/40 p-2 text-lg text-white backdrop-blur hover:bg-white/10 lg:inline-flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/40 bg-black/40 p-2 text-lg text-white backdrop-blur hover:bg-white/10 lg:inline-flex"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}
