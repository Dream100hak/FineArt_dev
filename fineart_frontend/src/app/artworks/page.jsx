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
    <div className="screen-padding section mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
      <header
        className="space-y-3 rounded-3xl border p-6 shadow-sm"
        style={{ backgroundColor: 'var(--board-bg)', borderColor: 'var(--board-border)' }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: 'var(--board-text-secondary)' }}>
          Collection
        </p>
        <h1 className="text-4xl font-bold" style={{ color: 'var(--board-text)' }}>
          작품 라이브러리
        </h1>
        <p style={{ color: 'var(--board-text-secondary)' }}>
          시장 데이터 기반으로 작품 정보와 실제 거래 현황을 확인하세요.
        </p>
        {isFallback && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            {SERVER_OFFLINE_MESSAGE}
          </p>
        )}
      </header>

      <section
        className="rounded-3xl border p-6 shadow-sm"
        style={{ backgroundColor: 'var(--board-bg)', borderColor: 'var(--board-border)' }}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {artworks.map((artwork) => (
            <article
              key={artwork.id}
              className="rounded-3xl border bg-white p-6 shadow-sm"
              style={{ borderColor: 'var(--board-border)' }}
            >
              <p className="text-xs uppercase" style={{ color: 'var(--board-text-secondary)' }}>
                {artwork.artistName ?? 'FineArt Artist'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold" style={{ color: 'var(--board-text)' }}>
                {artwork.title}
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
                {formatDate(artwork.createdAt)} · {artwork.status ?? 'Status TBD'}
              </p>
              <p className="mt-4 text-base font-semibold" style={{ color: 'var(--board-text)' }}>
                {formatPrice(artwork.price)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
