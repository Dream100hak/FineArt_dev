/**
 * 전시 공간(미술관·갤러리 등) 디렉터리 — 정적 시드 데이터.
 * 추후 Supabase `museum_spaces` 등 테이블로 이전 시 동일 필드 스키마를 유지하면 됩니다.
 */

export const MUSEUM_VIEW_MODES = [
  { value: 'all', label: '전체보기' },
  { value: 'curated', label: 'FineArt 추천' },
];

export const MUSEUM_CATEGORIES = [
  { value: '', label: '전체', iconClass: 'bg-neutral-300' },
  { value: 'museum', label: '미술관', iconClass: 'bg-orange-500' },
  { value: 'heritage', label: '박물관', iconClass: 'bg-violet-500' },
  { value: 'gallery', label: '갤러리', iconClass: 'bg-emerald-500' },
  { value: 'alternative', label: '대안공간', iconClass: 'bg-sky-500' },
  { value: 'unclassified', label: '미분류', iconClass: 'bg-neutral-400' },
  { value: 'other', label: '기타', iconClass: 'bg-neutral-500' },
];

export const MUSEUM_CATEGORY_VALUE_SET = new Set(
  MUSEUM_CATEGORIES.map((c) => c.value).filter(Boolean),
);

export const MUSEUM_REGIONS = [
  { id: '', label: '전체 지역' },
  { id: 'seoul_jongno', label: '종로·인사·삼청' },
  { id: 'seoul_jung', label: '중구·을지로' },
  { id: 'seoul_yongsan', label: '용산·한남' },
  { id: 'seoul_gangnam', label: '강남·역삼' },
  { id: 'seoul_mapo', label: '마포·홍대' },
  { id: 'seoul_seongsu', label: '성수·뚝섬' },
  { id: 'gyeonggi', label: '경기' },
  { id: 'other', label: '기타' },
];

const regionLabel = (id) => MUSEUM_REGIONS.find((r) => r.id === id)?.label ?? id;

const categoryLabel = (value) =>
  MUSEUM_CATEGORIES.find((c) => c.value === value)?.label ?? '기타';

const iconClassForCategory = (value) =>
  MUSEUM_CATEGORIES.find((c) => c.value === value)?.iconClass ?? 'bg-neutral-400';

/**
 * @type {Array<{
 *   id: string,
 *   name: string,
 *   category: string,
 *   region: string,
 *   address: string,
 *   phone?: string,
 *   website?: string,
 *   lat: number,
 *   lng: number,
 *   curated?: boolean,
 *   note?: string
 * }>}
 */
export const MUSEUM_SPACES_SEED = [
  {
    id: 'mmca-seoul',
    name: '국립현대미술관 서울',
    category: 'museum',
    region: 'seoul_jongno',
    address: '서울 종로구 삼청로 30',
    phone: '02-3701-9500',
    website: 'https://www.mmca.go.kr',
    lat: 37.5862,
    lng: 126.981,
    curated: true,
  },
  {
    id: 'leeum',
    name: '리움미술관',
    category: 'museum',
    region: 'seoul_yongsan',
    address: '서울 용산구 이태원로 55길 60-16',
    phone: '02-2014-6900',
    website: 'https://www.leeum.org',
    lat: 37.5393,
    lng: 126.9994,
    curated: true,
  },
  {
    id: 'sema',
    name: '서울시립미술관',
    category: 'museum',
    region: 'seoul_jung',
    address: '서울 중구 덕수궁길 61',
    phone: '02-2124-8800',
    website: 'https://www.sema.seoul.kr',
    lat: 37.5641,
    lng: 126.9737,
    curated: true,
  },
  {
    id: 'k-modern',
    name: 'K현대미술관',
    category: 'museum',
    region: 'seoul_gangnam',
    address: '서울 강남구 압구정로 465',
    phone: '02-541-3611',
    website: 'https://kmuseum.org',
    lat: 37.5273,
    lng: 127.0354,
    curated: true,
  },
  {
    id: 'arko',
    name: '아르코미술관',
    category: 'alternative',
    region: 'seoul_jongno',
    address: '서울 종로구 대학로 136',
    phone: '02-760-4500',
    website: 'https://www.artspace.or.kr',
    lat: 37.5815,
    lng: 127.0027,
    curated: false,
  },
  {
    id: 'artsonje',
    name: '아트선재센터',
    category: 'alternative',
    region: 'seoul_jongno',
    address: '서울 종로구 율곡로3길 87',
    phone: '02-733-8945',
    website: 'https://www.artsonje.org',
    lat: 37.5842,
    lng: 126.9818,
    curated: true,
  },
  {
    id: 'kukje',
    name: '국제갤러리',
    category: 'gallery',
    region: 'seoul_jongno',
    address: '서울 종로구 삼청로 54',
    phone: '02-735-8449',
    website: 'https://www.kukje.org',
    lat: 37.5886,
    lng: 126.9814,
    curated: true,
  },
  {
    id: 'pace-seoul',
    name: '페이스갤러리 서울',
    category: 'gallery',
    region: 'seoul_yongsan',
    address: '서울 용산구 이태원로 267',
    phone: '02-790-7438',
    website: 'https://www.pacegallery.com',
    lat: 37.5345,
    lng: 126.9946,
    curated: false,
  },
  {
    id: 'pkm',
    name: 'PKM갤러리',
    category: 'gallery',
    region: 'seoul_jongno',
    address: '서울 종로구 삼청로 7',
    phone: '02-734-9467',
    website: 'https://www.pkmgallery.com',
    lat: 37.5878,
    lng: 126.9821,
    curated: false,
  },
  {
    id: 'nmca',
    name: '국립중앙박물관',
    category: 'heritage',
    region: 'seoul_yongsan',
    address: '서울 용산구 서빙고로 137',
    phone: '02-2077-9000',
    website: 'https://www.museum.go.kr',
    lat: 37.5239,
    lng: 126.9802,
    curated: false,
  },
  {
    id: 'amorepacific',
    name: '아모레퍼시픽 미술관',
    category: 'museum',
    region: 'seoul_yongsan',
    address: '서울 용산구 한강대로 100',
    phone: '02-6040-2345',
    website: 'https://www.apma.amorepacific.com',
    lat: 37.5297,
    lng: 126.9646,
    curated: true,
  },
  {
    id: 'platoon',
    name: '플래툰 쿤스트할레',
    category: 'alternative',
    region: 'seoul_gangnam',
    address: '서울 강남구 논현로28길 46',
    phone: '02-749-3501',
    website: 'https://platoon.org',
    lat: 37.5236,
    lng: 127.037,
    curated: false,
  },
  {
    id: 'whanki',
    name: '환기미술관',
    category: 'museum',
    region: 'seoul_jongno',
    address: '서울 종로구 필운대로 132',
    phone: '02-391-7701',
    website: 'https://www.whankimuseum.org',
    lat: 37.5948,
    lng: 126.981,
    curated: false,
  },
  {
    id: 'ddp',
    name: 'DDP 디자인뮤지엄',
    category: 'unclassified',
    region: 'seoul_jung',
    address: '서울 중구 을지로 281',
    phone: '02-2153-0000',
    website: 'https://ddp.or.kr',
    lat: 37.5665,
    lng: 127.009,
    curated: false,
  },
  {
    id: 'heyri',
    name: '헤이리 예술마을(복합)',
    category: 'other',
    region: 'gyeonggi',
    address: '경기 파주시 탄현면 헤이리마을길 70-21',
    phone: '031-948-5241',
    website: 'https://www.heyri.net',
    lat: 37.747,
    lng: 126.697,
    curated: false,
  },
];

export function getMuseumCategoryLabel(value) {
  return categoryLabel(value || 'other');
}

export function getMuseumRegionLabel(id) {
  return regionLabel(id || '');
}

export function normalizeMuseumSpace(item) {
  return {
    ...item,
    categoryLabel: categoryLabel(item.category),
    regionLabel: regionLabel(item.region),
    iconClass: iconClassForCategory(item.category),
  };
}

export function filterMuseumSpaces(items, { category, region, keyword, view }) {
  const q = (keyword ?? '').toString().trim().toLowerCase();
  return items.filter((row) => {
    if (view === 'curated' && !row.curated) return false;
    if (category && row.category !== category) return false;
    if (region && row.region !== region) return false;
    if (!q) return true;
    const hay = `${row.name} ${row.address} ${row.phone ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
}

export function buildOsmEmbedUrl(lat, lng, padding = 0.012) {
  const minLat = lat - padding;
  const maxLat = lat + padding;
  const minLng = lng - padding;
  const maxLng = lng + padding;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik`;
}

export function buildGoogleMapsSearchUrl(lat, lng, name) {
  const q = encodeURIComponent(`${name} @${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
