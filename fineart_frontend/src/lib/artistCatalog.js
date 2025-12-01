import { getArtists, getArtworks, getExhibitions } from '@/lib/api';

const FALLBACK_ARTISTS = [
  {
    id: 'artist-1',
    slug: 'fallback-artist-1',
    name: '알 수 없음',
    nationality: 'KOR',
    discipline: 'Artist',
    bio: '기본 예비 작가입니다.',
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const FALLBACK_ARTWORKS = [
  {
    id: 'artwork-1',
    title: 'Untitled',
    artistName: '알 수 없음',
    status: 'ForSale',
    price: 0,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const FALLBACK_EXHIBITIONS = [
  {
    id: 'exhibition-1',
    title: 'Untitled Exhibition',
    artist: '알 수 없음',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-02T00:00:00Z',
    location: 'N/A',
  },
];

const toKey = (value) => {
  if (!value) return '';
  let raw = value;
  try {
    raw = decodeURIComponent(value);
  } catch {
    raw = value;
  }
  return raw.toString().trim().toLowerCase().replace(/\s+/g, '-');
};

const normalizeArtist = (item, index = 0) => {
  if (!item) return null;
  const name = item.name ?? item.Name ?? '작가 미정';
  const slugCandidate = item.slug ?? item.Slug ?? toKey(name);
  return {
    id: item.id ?? item.Id ?? `artist-${index + 1}`,
    slug: slugCandidate || `artist-${index + 1}`,
    name,
    nationality: item.nationality ?? item.Nationality ?? 'KOR',
    discipline: item.discipline ?? item.field ?? item.category ?? 'Artist',
    bio: item.bio ?? item.description ?? '소개가 준비중입니다.',
    createdAt: item.createdAt ?? item.CreatedAt ?? null,
  };
};

const normalizeArtwork = (item, index = 0) => {
  if (!item) return null;
  return {
    id: item.id ?? item.Id ?? `artwork-${index + 1}`,
    title: item.title ?? item.Title ?? '작품 미정',
    artistName: item.artistName ?? item.artist ?? item.Artist ?? '작가 미상',
    status: item.status ?? item.Status ?? 'Status',
    price: item.price ?? item.Price ?? null,
    createdAt: item.createdAt ?? item.CreatedAt ?? null,
    imageUrl:
      item.imageUrl ??
      item.ImageUrl ??
      item.thumbnailUrl ??
      item.ThumbnailUrl ??
      item.coverUrl ??
      item.CoverUrl ??
      '',
  };
};

const normalizeExhibition = (item, index = 0) => {
  if (!item) return null;
  const artistName = item.artistName ?? item.artist ?? item.Artist ?? '';
  const artistSlug = item.artistSlug ?? item.slug ?? '';
  return {
    id: item.id ?? item.Id ?? `exhibition-${index + 1}`,
    title: item.title ?? item.Title ?? '전시 미정',
    artist: artistName || '작가 미상',
    artistName,
    artistSlug,
    artistId: item.artistId ?? item.ArtistId ?? null,
    startDate: item.startDate ?? item.StartDate ?? null,
    endDate: item.endDate ?? item.EndDate ?? null,
    location: item.location ?? item.Location ?? null,
    category: item.category ?? item.Category ?? null,
    imageUrl:
      item.imageUrl ??
      item.ImageUrl ??
      item.thumbnailUrl ??
      item.ThumbnailUrl ??
      item.coverUrl ??
      item.CoverUrl ??
      null,
    description: item.description ?? item.Description ?? null,
  };
};

const groupByArtistKey = (collection, selector) => {
  const map = new Map();
  collection.forEach((item) => {
    const key = toKey(selector(item));
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
};

export async function loadArtistCatalog() {
  let artists = [];
  let artworks = [];
  let exhibitions = [];
  let isFallback = false;

  try {
    const payload = await getArtists();
    const source = Array.isArray(payload) ? payload : payload?.items ?? [];
    artists = source.map(normalizeArtist).filter(Boolean);
  } catch (error) {
    console.error('[ArtistCatalog] Failed to load artists:', error);
    artists = FALLBACK_ARTISTS.map(normalizeArtist);
    isFallback = true;
  }

  try {
    const payload = await getArtworks();
    const source = Array.isArray(payload) ? payload : payload?.items ?? [];
    artworks = source.map(normalizeArtwork).filter(Boolean);
  } catch (error) {
    console.error('[ArtistCatalog] Failed to load artworks:', error);
    artworks = FALLBACK_ARTWORKS.map(normalizeArtwork);
    isFallback = true;
  }

  try {
    const payload = await getExhibitions({ page: 1, size: 500 });
    const source = Array.isArray(payload) ? payload : payload?.items ?? [];
    exhibitions = source.map(normalizeExhibition).filter(Boolean);
  } catch (error) {
    console.error('[ArtistCatalog] Failed to load exhibitions:', error);
    exhibitions = FALLBACK_EXHIBITIONS.map(normalizeExhibition);
    isFallback = true;
  }

  const artworksByKey = groupByArtistKey(artworks, (item) => item.artistName);
  const exhibitionsByKey = groupByArtistKey(
    exhibitions,
    (item) => item.artistName || item.artist || item.artistSlug || item.artistId,
  );

  const catalog = artists.map((artist) => {
    const key = toKey(artist.name);
    const artistArtworks = [...(artworksByKey.get(key) ?? [])].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
    const artistExhibitions = exhibitionsByKey.get(key) ?? [];
    return {
      ...artist,
      artworkCount: artistArtworks.length,
      exhibitionCount: artistExhibitions.length,
      artworks: artistArtworks,
      exhibitions: artistExhibitions,
    };
  });

  return { catalog, isFallback };
}

export async function findArtistProfile(slugOrId) {
  const { catalog, isFallback } = await loadArtistCatalog();
  const normalizedSlug = toKey(slugOrId);
  const match =
    catalog.find((artist) => toKey(artist.slug) === normalizedSlug) ??
    catalog.find((artist) => toKey(artist.id) === normalizedSlug) ??
    catalog.find((artist) => toKey(artist.name) === normalizedSlug);

  if (!match) return null;
  return { ...match, isFallback };
}
