import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft, FiMessageSquare, FiShoppingBag } from 'react-icons/fi';
import { getArtworkById } from '@/lib/api';

export const revalidate = 0;

const STATUS_LABELS = {
  ForSale: { label: '판매중', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Sold: { label: '판매완료', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
  Rentable: { label: '렌탈가능', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const formatPrice = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return {};

  try {
    const artwork = await getArtworkById(id);
    if (!artwork) return {};
    return {
      title: `${artwork.title} · FineArt`,
      description: artwork.description?.slice(0, 120) ?? 'FineArt 작품 상세',
      openGraph: {
        title: artwork.title,
        description: artwork.description,
        images: artwork.imageUrl ? [{ url: artwork.imageUrl }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function ArtworkDetailPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return notFound();
  }

  let artwork = null;
  try {
    artwork = await getArtworkById(id);
  } catch (error) {
    console.error('[Sales Detail] Failed to load artwork:', error);
  }

  if (!artwork) {
    return notFound();
  }

  const badge = STATUS_LABELS[artwork.status] ?? STATUS_LABELS.ForSale;
  const createdAt = artwork.createdAt ? new Date(artwork.createdAt) : null;
  const updatedAt = artwork.updatedAt ? new Date(artwork.updatedAt) : null;
  const highlightChips = [artwork.mainTheme, artwork.material, artwork.size]
    .filter(Boolean)
    .slice(0, 3);

  const specList = [
    { label: '주제', value: [artwork.mainTheme, artwork.subTheme].filter(Boolean).join(' · ') || '정보 없음' },
    { label: '사이즈', value: artwork.size || '정보 없음' },
    { label: '재질', value: artwork.material || '정보 없음' },
    { label: '렌탈 여부', value: artwork.isRentable ? '가능' : '불가' },
    { label: '상태', value: badge.label },
  ];

  return (
    <main className="bg-white text-neutral-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 lg:flex-row">
        <div className="lg:w-1/2">
          <Link
            href="/sales"
            className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
          >
            <FiArrowLeft /> 목록으로
          </Link>
          <div className="relative overflow-hidden rounded-[40px] border border-neutral-100 bg-neutral-50">
            <img src={artwork.imageUrl} alt={artwork.title} className="h-full w-full object-cover" loading="lazy" />
          </div>
          {highlightChips.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {highlightChips.map((chip) => (
                <span key={chip} className="rounded-full border border-neutral-200 px-4 py-1 text-xs text-neutral-600">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-1/2">
          <div className="space-y-6 rounded-[32px] border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-[0.4em] text-neutral-400">FineArt Selection</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-semibold leading-tight">{artwork.title}</h1>
              <p className="mt-2 text-base text-neutral-500">
                {artwork.artistDisplayName || artwork.artistName || '익명 작가'}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">구매가</p>
                <p className="text-3xl font-semibold">{formatPrice(artwork.price)}</p>
              </div>
              {artwork.isRentable && (
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-neutral-400">렌탈</p>
                  <p className="text-lg font-medium text-amber-700">{formatPrice(artwork.rentPrice ?? 0)} / 월</p>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm text-neutral-600">
              <p>{artwork.description || '작품 설명이 아직 입력되지 않았습니다.'}</p>
              <p className="text-xs text-neutral-400">
                등록일 {createdAt?.toLocaleDateString('ko-KR') ?? '-'} · 업데이트 {updatedAt?.toLocaleDateString('ko-KR') ?? '-'}
              </p>
            </div>

            <dl className="grid gap-4 rounded-3xl border border-neutral-100 bg-neutral-50/60 p-6 text-sm text-neutral-600 sm:grid-cols-2">
              {specList.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs uppercase tracking-[0.35em] text-neutral-400">{item.label}</dt>
                  <dd className="font-medium text-neutral-900">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                <FiShoppingBag /> 구매하기
              </button>
              <button
                type="button"
                disabled={!artwork.isRentable}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
              >
                <FiMessageSquare /> 렌탈 문의
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
