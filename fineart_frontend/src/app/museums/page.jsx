import MuseumsClient from './MuseumsClient';
import {
  filterMuseumTaxonomy,
  loadMuseumTaxonomy,
  loadMuseumTaxonomyFromSupabase,
  paginateRows,
} from '@/lib/museumTaxonomy';

export const metadata = {
  title: '미술관 · 전시 공간 | FineArt',
  description:
    '미술관, 박물관, 갤러리, 대안공간 등 주요 전시 공간을 지역·유형별로 찾고 지도에서 위치를 확인하세요.',
};

const parsePage = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function MuseumsPage({ searchParams }) {
  const resolved = await searchParams;
  const majorParam = (resolved?.major ?? '').toString();
  const major = majorParam ? majorParam : '서울특별시';
  const district = (resolved?.district ?? '').toString();
  const type = (resolved?.type ?? '').toString();
  const keyword = (resolved?.keyword ?? '').toString();
  const page = parsePage(resolved?.page, 1);
  const pageSize = parsePage(resolved?.size, 60);

  const taxonomy = (await loadMuseumTaxonomyFromSupabase()) ?? (await loadMuseumTaxonomy());
  const filtered = filterMuseumTaxonomy(taxonomy.venues, {
    major,
    district,
    type,
    keyword,
  });
  const typeCounts = filtered.reduce((acc, row) => {
    const key = row.type || 'other';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const paginated = paginateRows(filtered, page, pageSize);
  const districtOptions = major ? taxonomy.districtOptionsMap.get(major) ?? [] : [];

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-7xl flex-col gap-8 py-10">
      <MuseumsClient
        major={major}
        district={district}
        type={type}
        keyword={keyword}
        page={paginated.page}
        pageSize={paginated.pageSize}
        total={paginated.total}
        items={paginated.items}
        majorOptions={taxonomy.majorOptions}
        districtOptions={districtOptions}
        typeOptions={taxonomy.typeOptions}
        typeCounts={typeCounts}
        dataSource={taxonomy.source}
        totalSourceCount={taxonomy.meta?.uniqueVenues ?? filtered.length}
      />
    </div>
  );
}
