import { getArtworks } from '@/lib/api';

const SERVER_OFFLINE_MESSAGE = '서버 점검 중입니다. 잠시 후 다시 시도해주세요.';

const fallbackArtworks = [
  {
    id: 'artwork-1',
    title: 'Light Fragment 07',
    artistName: '김서연',
    status: 'ForSale',
    price: 32000000,
    createdAt: '2025-10-12T00:00:00Z',
  },
  {
    id: 'artwork-2',
    title: 'Forest Diagram',
    artistName: 'Lena Cho',
    status: 'Sold',
    price: 18000000,
    createdAt: '2025-09-30T00:00:00Z',
  },
  {
    id: 'artwork-3',
    title: 'City Pulse',
    artistName: '정다은',
    status: 'Rentable',
    price: 8000000,
    createdAt: '2025-09-18T00:00:00Z',
  },
];

const normalizeArtworks = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).getFullYear();
  } catch (error) {
    return value;
  }
};

const formatPrice = (value) => {
  if (typeof value !== 'number') return '가격 문의';
  return `${value.toLocaleString('ko-KR')} KRW`;
};

async function loadArtworks() {
  try {
    const payload = await getArtworks();
    const artworks = normalizeArtworks(payload);
    return { artworks, isFallback: false };
  } catch (error) {
    console.error('[Artworks] Failed to fetch from API:', error);
    return { artworks: fallbackArtworks, isFallback: true };
  }
}

export const revalidate = 0;

export default async function ArtworksPage() {
  const { artworks, isFallback } = await loadArtworks();

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Collection</p>
        <h1 className="text-4xl font-semibold">작품 라이브러리</h1>
        <p className="text-neutral-600">시장 데이터 기반으로 작품 정보와 실제 거래 현황을 확인하세요.</p>
        {isFallback && (
          <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-800">{SERVER_OFFLINE_MESSAGE}</p>
        )}
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {artworks.map((artwork) => (
          <article key={artwork.id} className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">{artwork.artistName ?? 'FineArt Artist'}</p>
            <h2 className="mt-3 text-2xl font-semibold">{artwork.title}</h2>
            <p className="mt-2 text-sm text-neutral-500">
              {formatDate(artwork.createdAt)} · {artwork.status ?? 'Status TBD'}
            </p>
            <p className="mt-4 text-base font-semibold text-neutral-900">{formatPrice(artwork.price)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
