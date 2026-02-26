'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CARD_WIDTH = 280;
const GAP = 24;

export default function ArtistCarousel({
  items = [],
  categoryLabel = 'Artist',
  title = 'FineArt 작가',
  subtitle = '다양한 작가들을 만나보세요',
  moreHref,
  moreLabel = '전체 보기',
}) {
  const router = useRouter();
  const containerRef = useRef(null);
  const draggedRef = useRef(false);
  const [constraints, setConstraints] = useState({ left: 0, right: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  const x = useMotionValue(0);
  const springX = useSpring(x, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const updateConstraints = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const totalContentWidth = items.length * (CARD_WIDTH + GAP) - GAP;
        const maxScroll = Math.max(0, totalContentWidth - containerWidth);
        setConstraints({ left: -maxScroll, right: 0 });
      }
    };

    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, [items.length]);

  // 드래그/스크롤 시 하단 점 실시간 갱신
  useEffect(() => {
    const unsubscribe = springX.on('change', (latest) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const totalContentWidth = items.length * (CARD_WIDTH + GAP) - GAP;
      const range = Math.max(0, totalContentWidth - containerWidth);
      if (range > 0) {
        const progress = Math.max(0, Math.min(1, Math.abs(latest) / range));
        const index = Math.round(progress * (items.length - 1));
        setActiveIndex(Math.min(index, items.length - 1));
      }
    });
    return () => unsubscribe();
  }, [items.length, springX]);

  const handleScroll = (direction) => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.offsetWidth * 0.8;
    const currentX = springX.get();
    let newX = direction === 'left' ? currentX + scrollAmount : currentX - scrollAmount;
    newX = Math.max(constraints.left, Math.min(constraints.right, newX));
    x.set(newX);
  };

  const scrollToIndex = (i) => {
    const target = Math.max(0, Math.min(i, items.length - 1));
    const offset = target * (CARD_WIDTH + GAP);
    x.set(-offset);
    setActiveIndex(target);
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="relative border-b border-neutral-200 pb-4">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-neutral-500">{categoryLabel}</p>
          <h2 className="mt-1 text-3xl font-semibold text-neutral-900 md:text-4xl">{title}</h2>
          <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
        </div>
        {moreHref && (
          <Link
            href={moreHref}
            className="absolute right-0 top-0 rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
          >
            {moreLabel}
          </Link>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
      >
        <motion.div
          drag="x"
          dragConstraints={constraints}
          dragElastic={0.08}
          dragTransition={{ power: 0.2, timeConstant: 300 }}
          onDragStart={() => { draggedRef.current = true; }}
          onDragEnd={() => { setTimeout(() => { draggedRef.current = false; }, 0); }}
          style={{ x: springX }}
          className="flex gap-6"
        >
          {items.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!draggedRef.current) {
                  router.push(`/artists/${item.slug ?? item.id}`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!draggedRef.current) router.push(`/artists/${item.slug ?? item.id}`);
                }
              }}
              className="group flex shrink-0 cursor-pointer flex-col"
              style={{ width: CARD_WIDTH }}
            >
              <motion.div
                className="relative aspect-[4/5] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                whileHover={{ y: -8 }}
              >
                <img
                  src={item.displayImage ?? item.imageUrl ?? ''}
                  alt={item.name}
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
              <div className="mt-3 flex flex-col items-center text-center">
                <p className="line-clamp-1 text-sm font-medium text-neutral-900">
                  {item.displayArtworkTitle ?? item.name ?? 'Untitled'}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">{item.name}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 w-2 shrink-0 rounded-full transition ${i === activeIndex ? 'bg-neutral-900' : 'bg-neutral-300 hover:bg-neutral-400'}`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={activeIndex <= 0}
            aria-label="Previous"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={activeIndex >= items.length - 1}
            aria-label="Next"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50 disabled:pointer-events-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
