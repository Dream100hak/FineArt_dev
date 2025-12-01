import { notFound } from 'next/navigation';
import Link from 'next/link';

const artworkMap = {
  'artwork-1': {
    title: 'Light Fragment 07',
    artist: '김하연',
    medium: 'Oil on aluminum',
    dimensions: '120 x 90 cm',
    year: 2025,
  },
  'artwork-2': {
    title: 'Forest Diagram',
    artist: 'Lena Cho',
    medium: 'Pigment print',
    dimensions: '100 x 70 cm',
    year: 2024,
  },
  'artwork-3': {
    title: 'City Pulse',
    artist: '하정우',
    medium: 'LED installation',
    dimensions: 'Variable',
    year: 2023,
  },
};

export default function ArtworkDetailPage({ params }) {
  const artwork = artworkMap[params.id];

  if (!artwork) {
    notFound();
  }

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link href="/artworks" className="text-sm text-primary">
        ← 작품 목록
      </Link>
      <article className="rounded-3xl border border-neutral-100 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">{artwork.artist}</p>
        <h1 className="mt-3 text-4xl font-semibold">{artwork.title}</h1>
        <dl className="mt-6 grid grid-cols-1 gap-4 text-sm text-neutral-600 md:grid-cols-2">
          <div>
            <dt className="font-semibold text-neutral-500">Medium</dt>
            <dd>{artwork.medium}</dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-500">Dimensions</dt>
            <dd>{artwork.dimensions}</dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-500">Year</dt>
            <dd>{artwork.year}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
