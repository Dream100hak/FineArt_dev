'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

const useMedia = (queries, values, defaultValue) => {
  const get = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return defaultValue;
    }
    const index = queries.findIndex((q) => window.matchMedia(q).matches);
    return values[index] ?? defaultValue;
  };

  const [value, setValue] = useState(get);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQueryLists = queries.map((q) => window.matchMedia(q));
    const handler = () => setValue(get);

    mediaQueryLists.forEach((mql) => mql.addEventListener('change', handler));
    return () => mediaQueryLists.forEach((mql) => mql.removeEventListener('change', handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries]);

  return value;
};

const useMeasure = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
};

const preloadImages = async (urls) => {
  const validUrls = (urls ?? []).filter(Boolean);
  if (!validUrls.length) return { failed: [] };

  const failed = [];

  await Promise.all(
    validUrls.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => {
            failed.push(src);
            resolve();
          };
          img.src = src;
        }),
    ),
  );

  return { failed };
};

const Masonry = ({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
}) => {
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [5, 4, 3, 2],
    1,
  );

  const [containerRef, { width }] = useMeasure();
  const [imagesReady, setImagesReady] = useState(false);
  const [brokenUrls, setBrokenUrls] = useState([]);

  useEffect(() => {
    if (!items?.length) {
      setBrokenUrls([]);
      setImagesReady(true);
      return;
    }
    const imageUrls = items.map((i) => i.img).filter(Boolean);
    if (!imageUrls.length) {
      setBrokenUrls([]);
      setImagesReady(true);
      return;
    }
    preloadImages(imageUrls).then((result) => {
      setBrokenUrls(result?.failed ?? []);
      setImagesReady(true);
    });
  }, [items]);

  const grid = useMemo(() => {
    if (!width || !items?.length) return [];

    const colHeights = new Array(columns).fill(0);
    const columnWidth = width / columns;

    return items.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = columnWidth * col;
      const height = child.height / 2;
      const y = colHeights[col];

      colHeights[col] += height;

      return { ...child, x, y, w: columnWidth, h: height };
    });
  }, [columns, items, width]);

  const totalHeight = useMemo(
    () => (grid.length ? Math.max(...grid.map((item) => item.y + item.h)) : 0),
    [grid],
  );

  const hasMounted = useRef(false);

  const getInitialPosition = (item) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;

    if (animateFrom === 'random') {
      const directions = ['top', 'bottom', 'left', 'right'];
      direction = directions[Math.floor(Math.random() * directions.length)];
    }

    switch (direction) {
      case 'top':
        return { x: item.x, y: -200 };
      case 'bottom':
        return { x: item.x, y: window.innerHeight + 200 };
      case 'left':
        return { x: -200, y: item.y };
      case 'right':
        return { x: window.innerWidth + 200, y: item.y };
      case 'center':
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  };

  useLayoutEffect(() => {
    if (!imagesReady || !grid.length) return;

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      if (!hasMounted.current) {
        const initialPos = getInitialPosition(item, index);
        const initialState = {
          opacity: 0,
          x: initialPos.x,
          y: initialPos.y,
          width: item.w,
          height: item.h,
          ...(blurToFocus && { filter: 'blur(10px)' }),
        };

        gsap.fromTo(selector, initialState, {
          opacity: 1,
          ...animationProps,
          ...(blurToFocus && { filter: 'blur(0px)' }),
          duration: 0.8,
          ease: 'power3.out',
          delay: index * stagger,
        });
      } else {
        gsap.to(selector, {
          ...animationProps,
          duration,
          ease,
          overwrite: 'auto',
        });
      }
    });

    hasMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease]);

  const handleMouseEnter = (e, item) => {
    const element = e.currentTarget;
    const selector = `[data-key="${item.id}"]`;

    if (scaleOnHover) {
      gsap.to(selector, {
        scale: hoverScale,
        duration: 0.3,
        ease: 'power2.out',
      });
    }

    if (colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay');
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0.3,
          duration: 0.3,
        });
      }
    }
  };

  const handleMouseLeave = (e, item) => {
    const element = e.currentTarget;
    const selector = `[data-key="${item.id}"]`;

    if (scaleOnHover) {
      gsap.to(selector, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    }

    if (colorShiftOnHover) {
      const overlay = element.querySelector('.color-overlay');
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.3,
        });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={totalHeight ? { height: totalHeight } : undefined}
    >
      {grid.map((item) => (
        <div
          key={item.id}
          data-key={item.id}
          className="group absolute top-0 left-0 cursor-pointer p-1.5"
          onClick={() => window.open(item.url, '_blank', 'noopener')}
          onMouseEnter={(e) => handleMouseEnter(e, item)}
          onMouseLeave={(e) => handleMouseLeave(e, item)}
        >
          {(() => {
            const isBroken = item.img && brokenUrls.includes(item.img);
            const hasImage = item.img && !isBroken;
            return (
              <div
            className="relative h-full w-full overflow-hidden rounded-[10px] bg-cover bg-center text-[10px] uppercase leading-[10px] shadow-[0_10px_50px_-10px_rgba(0,0,0,0.2)]"
            style={
              hasImage
                ? { backgroundImage: `url(${item.img})` }
                : { backgroundColor: '#e5e5e5' }
            }
          >
            {!hasImage && (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xs font-semibold tracking-[0.25em] text-neutral-600">
                  Fine art
                </span>
              </div>
            )}
            {colorShiftOnHover && (
              <div
                className="color-overlay pointer-events-none absolute inset-0 rounded-[8px]"
                style={{
                  background:
                    'linear-gradient(45deg, rgba(255,0,150,0.5), rgba(0,150,255,0.5))',
                  opacity: 0,
                }}
              />
            )}
            {(item.title || item.artist) && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {item.title && (
                  <p className="px-3 text-center text-sm font-semibold text-white md:text-base">
                    {item.title}
                  </p>
                )}
                {item.artist && (
                  <p className="mt-1 px-3 text-center text-xs text-white/90 md:text-sm">
                    {item.artist}
                  </p>
                )}
              </div>
            )}
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
};

export default Masonry;

