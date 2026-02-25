'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Galaxy from '@/components/Galaxy';

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
      <div className="absolute inset-0">
        <Galaxy
          mouseInteraction={false}
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          starSpeed={0.5}
          speed={1}
          transparent
          className="opacity-50"
        />
      </div>
      {active.image ? (
        <img
          src={active.image}
          alt={active.title ?? 'FineArt hero'}
          className="absolute inset-0 h-full w-full object-cover opacity-90"
          style={{ objectPosition: active.objectPosition ?? 'center center' }}
        />
      ) : null}

      <div className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl font-semibold leading-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.8)] md:text-6xl lg:text-7xl">
          Fine Art
        </h1>
        <p className="mt-4 text-xl text-white/95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] md:text-2xl">
          작가와 컬렉터를 이어주는 갤러리
        </p>
        <p className="mt-3 max-w-2xl text-sm text-white/90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] md:text-base">
          전시, 판매, 렌탈을 하나의 공간에서 경험하세요. 큐레이션된 작품과 새로운 아티스트를 소개합니다.
        </p>
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
