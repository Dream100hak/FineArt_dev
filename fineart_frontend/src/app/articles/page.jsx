import ArticleCard from '@/components/articles/ArticleCard';
import ArticleFilters from '@/components/articles/ArticleFilters';
import ArticlePagination from '@/components/articles/ArticlePagination';
import AuthDebugBadge from '@/components/AuthDebugBadge';
import { getArticles } from '@/lib/api';

export const revalidate = 0;

const CATEGORY_TABS = [
  { value: '', label: '전체' },
  { value: 'notice', label: '공지사항' },
  { value: 'event', label: '이벤트' },
  { value: 'free', label: '자유게시판' },
];

const FALLBACK_ARTICLES = [
  {
    id: 'seed-notice',
    title: '서비스 오픈 안내',
    content: 'FineArt 게시판 정식 오픈을 축하합니다. 새로운 공지와 전시 소식을 확인하세요.',
    author: 'FineArt Admin',
    category: 'notice',
    createdAt: '2025-01-15T00:00:00Z',
    thumbnailUrl: 'https://cdn.fineart.local/articles/notice-thumb.jpg',
    imageUrl: 'https://cdn.fineart.local/articles/notice-hero.jpg',
  },
  {
    id: 'seed-event',
    title: '3월 라이브 옥션',
    content: '프리미엄 작가 10인의 대표작을 소개합니다. 온라인 라이브로 참여하세요.',
    author: 'Curator Team',
    category: 'event',
    createdAt: '2025-02-20T00:00:00Z',
    thumbnailUrl: 'https://cdn.fineart.local/articles/event-thumb.jpg',
    imageUrl: 'https://cdn.fineart.local/articles/event-hero.jpg',
  },
  {
    id: 'seed-free',
    title: '거장 추천 전시 5선',
    content: '주말에 가기 좋은 전시들을 에디터가 직접 선정했습니다.',
    author: 'Community Host',
    category: 'free',
    createdAt: '2025-03-03T00:00:00Z',
    thumbnailUrl: 'https://cdn.fineart.local/articles/free-thumb.jpg',
    imageUrl: 'https://cdn.fineart.local/articles/free-hero.jpg',
  },
];

const readArticleId = (item, fallback) => {
  if (!item) return fallback;
  return item.id ?? item.Id ?? item.ID ?? fallback;
};

const normalizeArticle = (item, index) => {
  if (!item) return null;
  const images = Array.isArray(item.images) ? item.images : [];
  return {
    id: readArticleId(item, `article-${index}`),
    title: item.title ?? '제목 미확인',
    content: item.content ?? '',
    author: item.author ?? item.writer ?? 'FineArt',
    category: item.category ?? 'free',
    createdAt: item.createdAt ?? new Date().toISOString(),
    imageUrl: item.imageUrl ?? images[0] ?? null,
    thumbnailUrl: item.thumbnailUrl ?? images[1] ?? item.imageUrl ?? null,
    images,
    views: item.views ?? 0,
  };
};

const normalizeArticles = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.map(normalizeArticle).filter(Boolean);
  }

  if (Array.isArray(payload.items)) {
    return payload.items.map(normalizeArticle).filter(Boolean);
  }

  return [];
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function ArticlesPage(props) {
  const resolvedParams = await props.searchParams;
  const category = resolvedParams?.category ?? '';
  const keyword = resolvedParams?.keyword ?? '';
  const page = parseNumber(resolvedParams?.page, 1);
  const size = parseNumber(resolvedParams?.size, 12);

  let payload = null;
  let isFallback = false;

  try {
    payload = await getArticles({
      category: category || undefined,
      keyword: keyword || undefined,
      page,
      size,
    });
  } catch (error) {
    console.error('[Articles] Failed to fetch from API:', error);
    isFallback = true;
  }

  const articles = normalizeArticles(payload ?? FALLBACK_ARTICLES);
  const hasResults = articles.length > 0;

  const meta = {
    total: payload?.total ?? articles.length,
    page: payload?.page ?? page,
    size: payload?.size ?? size,
  };

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Stories &amp; Insights</p>
            <h1 className="text-4xl font-semibold text-neutral-900">FineArt 게시판</h1>
          </div>
          <AuthDebugBadge />
        </div>
        <p className="text-neutral-600">
          공지, 이벤트, 자유게시판을 한 곳에서 확인하고 검색·필터링해 보세요.
        </p>
        {isFallback && (
          <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-800">
            서버 응답이 지연되어 샘플 데이터를 표시하고 있습니다.
          </p>
        )}
      </header>

      <ArticleFilters
        categories={CATEGORY_TABS}
        activeCategory={category}
        initialKeyword={keyword}
        pageSize={meta.size}
      />

      {!hasResults ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-500">
          조건에 해당하는 게시글이 없습니다. 다른 검색어나 카테고리를 선택해 보세요.
        </div>
      ) : (
        <>
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </section>
          <ArticlePagination page={meta.page} size={meta.size} total={meta.total} />
        </>
      )}
    </div>
  );
}
