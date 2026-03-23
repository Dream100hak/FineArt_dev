import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiExternalLink, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { loadMuseumTaxonomy, loadMuseumTaxonomyFromSupabase } from '@/lib/museumTaxonomy';

export const revalidate = 0;

export default async function MuseumDetailPage({ params }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent((rawId ?? '').toString());
  if (!id) notFound();

  const taxonomy = (await loadMuseumTaxonomyFromSupabase()) ?? (await loadMuseumTaxonomy());
  const item = taxonomy.venues.find((row) => row.id === id);
  if (!item) notFound();

  const formatAddress = (value) => {
    const addr = (value ?? '').toString().trim();
    if (!addr) return '';

    const idx = addr.indexOf(',');
    if (idx === -1) return addr;

    const prefix = addr.slice(0, idx).trim();
    const rest = addr.slice(idx + 1).trim();

    // drop "<postal> , " prefix when missing postal becomes "- , ...".
    if (prefix === '-' || prefix === '' || /^\d/.test(prefix)) {
      return rest || addr;
    }

    return addr;
  };

  const formattedAddress = formatAddress(item.address);
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    formattedAddress || item.name,
  )}&output=embed`;
  const isSeoul = item.major === '서울특별시';

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">
      <Link
        href="/museums"
        className="inline-flex w-fit rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
      >
        ← 미술관 목록
      </Link>

      <article className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">{item.typeLabel}</p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900 md:text-4xl">{item.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-700">{item.major}</span>
              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-700">
                {item.district || '구/시/군 미상'}
              </span>
              {isSeoul && item.district && (
                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-800">
                  서울 소분류: {item.district}
                </span>
              )}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${item.address || ''}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-50"
          >
            구글 지도 <FiExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-700 md:grid-cols-2">
          <p className="flex items-start gap-2">
            <FiMapPin className="mt-0.5 shrink-0" />
            {formattedAddress || item.address || '주소 정보 없음'}
          </p>
          <p className="flex items-start gap-2">
            <FiPhone className="mt-0.5 shrink-0" />
            {item.phone ? (
              <a href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-neutral-900 hover:underline">
                {item.phone}
              </a>
            ) : (
              '전화번호 정보 없음'
            )}
          </p>
          <p className="flex items-start gap-2">
            <FiMail className="mt-0.5 shrink-0" />
            {item.email ? (
              <a href={`mailto:${item.email}`} className="hover:text-neutral-900 hover:underline">
                {item.email}
              </a>
            ) : (
              '이메일 정보 없음'
            )}
          </p>
          <p>
            분류: {item.major || '미상'} / {item.district || '미상'} / {item.neighborhood || '미상'}
          </p>
          {item.homepage && (
            <p className="md:col-span-2">
              홈페이지:{' '}
              <a
                href={item.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-700 hover:underline"
              >
                {item.homepage}
              </a>
            </p>
          )}
          {item.sourceArea && <p className="md:col-span-2">원본 분류: {item.sourceArea}</p>}
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-100 bg-white p-4">
          <h2 className="text-sm font-semibold text-neutral-900">상세 정보</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {item.detailInfo || '등록된 상세 설명이 없습니다. 전화 또는 지도 링크로 최신 정보를 확인해 주세요.'}
          </p>
        </div>
      </article>

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <iframe
          title={`${item.name} 지도`}
          className="h-[420px] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
        />
      </section>
    </div>
  );
}

