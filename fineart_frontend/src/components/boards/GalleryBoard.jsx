'use client';

import Link from 'next/link';

const fallbackImage = (seed) =>
  `https://source.unsplash.com/collection/190727/${300 + seed}x${240 + seed}`;

export default function GalleryBoard({ board, articles }) {
  const slug = board?.slug ?? '';
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article, index) => {
        const image = article.thumbnailUrl || article.imageUrl || fallbackImage(index);
        return (
          <Link
            key={article.id}
            href={`/boards/${slug}/${article.id}`}
            className="group relative block overflow-hidden rounded-3xl border border-neutral-100 shadow-sm"
          >
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img
                src={image}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]">
                  {article.category || '카테고리'}
                </p>
                <p className="text-lg font-semibold">{article.title}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
