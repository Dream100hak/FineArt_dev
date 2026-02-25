'use client';

import { useMemo } from 'react';
import Masonry from './Masonry';

export default function SalesMasonry({ artworks }) {
  const items = useMemo(
    () =>
      (artworks ?? []).map((artwork, index) => ({
        id: artwork.id ?? `artwork-${index}`,
        img: artwork.hasRealImage ? artwork.imageUrl : null,
        url: `/sales/${artwork.id}`,
        title: artwork.title,
        artist: artwork.artist,
        // 다양한 높이로 테스트용 Masonry 효과
        height: 320 + (index % 5) * 80,
      })),
    [artworks],
  );

  if (!items.length) return null;

  return (
    <Masonry
      items={items}
      ease="power3.out"
      duration={0.6}
      stagger={0.05}
      animateFrom="bottom"
      scaleOnHover
      hoverScale={0.97}
      blurToFocus
      colorShiftOnHover={false}
    />
  );
}

