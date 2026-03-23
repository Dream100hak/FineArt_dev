import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const TAXONOMY_CANDIDATES = [
  path.join(process.cwd(), 'data', 'museums-taxonomy.json'),
  path.join(process.cwd(), 'data', 'galleries-taxonomy.json'),
];

const TYPE_META = {
  museum: { label: '미술관', iconClass: 'bg-orange-500' },
  heritage: { label: '박물관', iconClass: 'bg-violet-500' },
  gallery: { label: '갤러리', iconClass: 'bg-emerald-500' },
  art_space: { label: '아트스페이스', iconClass: 'bg-cyan-500' },
  project_space: { label: '프로젝트 공간', iconClass: 'bg-indigo-500' },
  foundation: { label: '재단/기관', iconClass: 'bg-rose-500' },
  alternative: { label: '대안공간', iconClass: 'bg-sky-500' },
  other: { label: '기타', iconClass: 'bg-neutral-500' },
};

const TYPE_FILTER_KEYS = ['museum', 'heritage', 'gallery', 'art_space'];

const TYPE_OPTIONS = [
  { value: '', label: '전체 유형' },
  ...TYPE_FILTER_KEYS.map((value) => ({ value, label: TYPE_META[value].label })),
];

let taxonomyCache = null;

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const inferType = (name = '') => {
  const normalized = name.toLowerCase();
  if (name.includes('재단') || normalized.includes('foundation')) return 'foundation';
  if (name.includes('미술관')) return 'museum';
  if (name.includes('박물관') || normalized.includes('museum')) return 'heritage';
  if (name.includes('아트스페이스') || normalized.includes('artspace') || normalized.includes('art space')) return 'art_space';
  if (name.includes('프로젝트') || normalized.includes('project')) return 'project_space';
  if (name.includes('갤러리') || normalized.includes('gallery') || name.includes('화랑')) return 'gallery';
  if (name.includes('아트센터') || name.includes('문화센터') || name.includes('센터')) return 'alternative';
  return 'other';
};

const toId = (venue, region, district, neighborhood) =>
  normalizeString(venue.gno) ||
  `${region.id}-${district.key}-${neighborhood.key}-${normalizeString(venue.name)}`.replace(/\s+/g, '-');

const flattenVenues = (taxonomy) => {
  const regions = Array.isArray(taxonomy?.regions) ? taxonomy.regions : [];
  const rows = [];
  regions.forEach((region) => {
    const districts = Array.isArray(region.districts) ? region.districts : [];
    districts.forEach((district) => {
      const neighborhoods = Array.isArray(district.neighborhoods) ? district.neighborhoods : [];
      neighborhoods.forEach((neighborhood) => {
        const venues = Array.isArray(neighborhood.venues) ? neighborhood.venues : [];
        venues.forEach((venue) => {
          const name = normalizeString(venue.name);
          if (!name) return;
          const type = inferType(name);
          rows.push({
            id: toId(venue, region, district, neighborhood),
            gno: normalizeString(venue.gno),
            name,
            type,
            typeLabel: TYPE_META[type].label,
            typeIconClass: TYPE_META[type].iconClass,
            phone: normalizeString(venue.phone),
            email: normalizeString(venue.email),
            homepage: normalizeString(venue.homepage),
            address: normalizeString(venue.address),
            detailInfo: normalizeString(venue.detailInfo),
            major: normalizeString(region.name),
            district: normalizeString(district.name),
            neighborhood: normalizeString(neighborhood.name),
            sourceArea: normalizeString(venue.sources?.[0]?.areaLabel),
          });
        });
      });
    });
  });

  return rows.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
};

const buildMajorOptions = (taxonomy) => {
  const regions = Array.isArray(taxonomy?.regions) ? taxonomy.regions : [];
  return regions.map((region) => ({
    value: normalizeString(region.name),
    label: normalizeString(region.name),
    count: Number(region.count) || 0,
  }));
};

const buildDistrictOptions = (taxonomy) => {
  const regions = Array.isArray(taxonomy?.regions) ? taxonomy.regions : [];
  const map = new Map();

  regions.forEach((region) => {
    const regionName = normalizeString(region.name);
    const districts = Array.isArray(region.districts) ? region.districts : [];
    map.set(
      regionName,
      districts.map((district) => ({
        value: normalizeString(district.name),
        label: normalizeString(district.name),
        count: Number(district.count) || 0,
      })),
    );
  });

  return map;
};

const matchesKeyword = (row, keyword) => {
  if (!keyword) return true;
  const q = keyword.toLowerCase();
  return [
    row.name,
    row.address,
    row.phone,
    row.major,
    row.district,
    row.neighborhood,
    row.sourceArea,
    row.detailInfo,
  ]
    .join(' ')
    .toLowerCase()
    .includes(q);
};

export async function loadMuseumTaxonomy() {
  if (taxonomyCache) return taxonomyCache;

  let raw = null;
  for (const filePath of TAXONOMY_CANDIDATES) {
    try {
      raw = await readFile(filePath, 'utf-8');
      break;
    } catch {
      continue;
    }
  }
  if (!raw) {
    throw new Error('taxonomy json not found: data/museums-taxonomy.json or data/galleries-taxonomy.json');
  }

  const json = JSON.parse(raw);
  const venues = flattenVenues(json);
  const majorOptions = buildMajorOptions(json);
  const districtOptionsMap = buildDistrictOptions(json);

  taxonomyCache = {
    source: 'local',
    meta: json.meta ?? {},
    venues,
    majorOptions,
    districtOptionsMap,
    typeOptions: TYPE_OPTIONS,
  };

  return taxonomyCache;
}

export function filterMuseumTaxonomy(venues, { major, district, type, keyword }) {
  const normalizedKeyword = normalizeString(keyword);
  return venues.filter((row) => {
    if (major && row.major !== major) return false;
    if (district && row.district !== district) return false;
    if (type && row.type !== type) return false;
    if (!matchesKeyword(row, normalizedKeyword)) return false;
    return true;
  });
}

export function paginateRows(rows, page, pageSize) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 60;
  const start = (safePage - 1) * safePageSize;
  return {
    page: safePage,
    pageSize: safePageSize,
    total: rows.length,
    items: rows.slice(start, start + safePageSize),
  };
}

const uniqByValue = (values = []) =>
  Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean)));

export async function loadMuseumTaxonomyFromSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('museum_spaces')
    .select(
      'external_id,name,type,phone,email,homepage,address,detail_info,major,district,neighborhood,source_area,metadata',
      { count: 'exact' },
    )
    .order('name', { ascending: true })
    .limit(5000);

  if (error) {
    console.warn('[Museums] Failed to load museum_spaces from Supabase:', error.message);
    return null;
  }

  const rows = (data ?? []).map((row) => ({
    id: normalizeString(row.external_id) || normalizeString(row.name),
    gno: normalizeString(row.external_id),
    name: normalizeString(row.name),
    type: normalizeString(row.type) || 'other',
    typeLabel: TYPE_META[normalizeString(row.type)]?.label ?? TYPE_META.other.label,
    typeIconClass: TYPE_META[normalizeString(row.type)]?.iconClass ?? TYPE_META.other.iconClass,
    phone: normalizeString(row.phone),
    email: normalizeString(row.email),
    homepage: normalizeString(row.homepage),
    address: normalizeString(row.address),
    detailInfo: normalizeString(row.detail_info),
    major: normalizeString(row.major),
    district: normalizeString(row.district),
    neighborhood: normalizeString(row.neighborhood),
    sourceArea: normalizeString(row.source_area),
    metadata: row.metadata ?? {},
  }));

  if (rows.length === 0) return null;

  const majorOptions = uniqByValue(rows.map((row) => row.major)).map((major) => ({
    value: major,
    label: major,
    count: rows.filter((row) => row.major === major).length,
  }));

  const districtOptionsMap = new Map();
  majorOptions.forEach((majorOpt) => {
    const districts = uniqByValue(
      rows.filter((row) => row.major === majorOpt.value).map((row) => row.district),
    ).map((district) => ({
      value: district,
      label: district,
      count: rows.filter((row) => row.major === majorOpt.value && row.district === district).length,
    }));
    districtOptionsMap.set(majorOpt.value, districts);
  });

  return {
    source: 'supabase',
    meta: {
      uniqueVenues: rows.length,
    },
    venues: rows,
    majorOptions,
    districtOptionsMap,
    typeOptions: TYPE_OPTIONS,
  };
}

