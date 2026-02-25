const CATEGORY_VALUES = ['solo', 'group', 'digital', 'installation'];
export const EXHIBITION_CATEGORY_VALUE_SET = new Set(CATEGORY_VALUES);

export const EXHIBITION_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'solo', label: 'Solo' },
  { value: 'group', label: 'Group' },
  { value: 'digital', label: 'Digital' },
  { value: 'installation', label: 'Installation' },
];

const CATEGORY_LABEL_MAP = new Map(
  EXHIBITION_CATEGORIES.filter(({ value }) => value).map(({ value, label }) => [value, label]),
);

export const getExhibitionCategoryLabel = (value) =>
  (value ? CATEGORY_LABEL_MAP.get(value) : null) ?? value ?? 'Other';

export const FALLBACK_EXHIBITIONS = [];

const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1800&q=80';

const toIsoString = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const coerceCategory = (value) => {
  const normalized = (value ?? '').toString().toLowerCase();
  return EXHIBITION_CATEGORY_VALUE_SET.has(normalized) ? normalized : '';
};

export function normalizeExhibition(item, index = 0) {
  if (!item) return null;

  const category = coerceCategory(item.category ?? item.Category);

  return {
    id:
      item.id ??
      item.Id ??
      item.slug ??
      item.Slug ??
      item.exhibitionId ??
      `exhibition-${index}`,
    title: item.title ?? item.Title ?? 'Untitled exhibition',
    description:
      item.description ??
      item.Description ??
      item.synopsis ??
      'Exhibition information will be updated soon.',
    artist: item.artist ?? item.Artist ?? 'FineArt Curator',
    host: item.host ?? item.Host ?? '',
    participants: item.participants ?? item.Participants ?? '',
    startDate: toIsoString(item.startDate ?? item.StartDate ?? item.start_date),
    endDate: toIsoString(item.endDate ?? item.EndDate ?? item.end_date),
    imageUrl:
      item.imageUrl ??
      item.ImageUrl ??
      item.image_url ??
      item.thumbnailUrl ??
      item.coverUrl ??
      DEFAULT_IMAGE,
    location: item.location ?? item.Location ?? 'FineArt Space',
    category,
    createdAt: toIsoString(item.createdAt ?? item.CreatedAt ?? item.created_at) ?? new Date().toISOString(),
  };
}

export const FALLBACK_EXHIBITIONS_MAP = FALLBACK_EXHIBITIONS.map((item, index) =>
  normalizeExhibition(item, index),
);

export function normalizeExhibitionsFromPayload(payload) {
  const collection = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : [];

  return collection.map(normalizeExhibition).filter(Boolean);
}

export function formatExhibitionPeriod(startDate, endDate, location) {
  const start = startDate ? DISPLAY_DATE_FORMATTER.format(new Date(startDate)) : null;
  const end = endDate ? DISPLAY_DATE_FORMATTER.format(new Date(endDate)) : null;

  let range = '';
  if (start && end) {
    range = `${start} – ${end}`;
  } else if (start) {
    range = `${start} – ongoing`;
  } else if (end) {
    range = `Now – ${end}`;
  } else {
    range = 'Schedule TBD';
  }

  if (location) {
    range = `${range} · ${location}`;
  }

  return range;
}

export function filterExhibitionsByQuery(exhibitions, { category, keyword }) {
  const normalizedCategory = coerceCategory(category);
  const normalizedKeyword = (keyword ?? '').trim().toLowerCase();

  return exhibitions.filter((exhibition) => {
    const matchesCategory = !normalizedCategory || exhibition.category === normalizedCategory;
    if (!normalizedKeyword) return matchesCategory;

    const haystack = [
      exhibition.title,
      exhibition.artist,
      exhibition.host,
      exhibition.location,
      exhibition.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return matchesCategory && haystack.includes(normalizedKeyword);
  });
}

const toHeroSlide = (exhibition) => ({
  id: exhibition.id,
  title: exhibition.title,
  period: formatExhibitionPeriod(exhibition.startDate, exhibition.endDate, exhibition.location),
  synopsis: exhibition.description,
  image: exhibition.imageUrl,
  objectPosition: 'center center',
  info: [
    exhibition.host ? `Host · ${exhibition.host}` : null,
    exhibition.location ? `Location · ${exhibition.location}` : null,
    exhibition.category ? `Category · ${getExhibitionCategoryLabel(exhibition.category)}` : null,
  ].filter(Boolean),
  cta: { href: `/exhibitions/${exhibition.id}`, label: '자세히 보기' },
});

export function buildHeroSlides(exhibitions) {
  const source = exhibitions?.length ? exhibitions : [];
  if (!source.length) {
    return [
      {
        id: 'fineart-hero',
        title: 'FineArt Digital Gallery',
        period: 'Curating exhibitions · sales · rentals',
        synopsis:
          '작가와 컬렉터를 잇는 FineArt가 새로운 전시를 준비하고 있습니다. 컬렉션을 둘러보고 업데이트 소식을 받아보세요.',
        image: null,
        objectPosition: 'center center',
        info: ['FineArt · Curated experience', 'Sales · Rental · Archive'],
        cta: { href: '/sales', label: '컬렉션 보기' },
        infoCta: { href: '/exhibitions', label: '전시 캘린더 보기' },
      },
    ];
  }

  return source.slice(0, 3).map(toHeroSlide);
}

export function findFallbackExhibition(id) {
  if (!id) return null;
  return FALLBACK_EXHIBITIONS_MAP.find(
    (exhibition) => String(exhibition.id).toLowerCase() === String(id).toLowerCase(),
  );
}
