/* eslint-disable @next/next/no-img-element */
import ArticleAdminActions from '@/components/articles/ArticleAdminActions';
import { getArticleById } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const SERVER_OFFLINE_MESSAGE = '서버 연결에 실패하여 샘플 데이터를 표시하고 있습니다.';

const FALLBACK_ARTICLES = new Map([
  [
    'seed-notice',
    {
      id: 'seed-notice',
      title: '서비스 오픈 안내',
      content:
        '<p>FineArt 게시판이 정식 오픈했습니다. 공지사항과 전시 소식을 빠르게 받아보세요.</p>',
      author: 'FineArt Admin',
      category: 'notice',
      createdAt: '2025-01-15T00:00:00Z',
      imageUrl: 'https://cdn.fineart.local/articles/notice-hero.jpg',
      thumbnailUrl: 'https://cdn.fineart.local/articles/notice-thumb.jpg',
    },
  ],
  [
    'seed-event',
    {
      id: 'seed-event',
      title: '3월 라이브 옥션',
      content:
        '<p>프리미엄 작가 10인의 대표작이 라이브 옥션으로 진행됩니다. 미리 캘린더에 등록하세요.</p>',
      author: 'Curator Team',
      category: 'event',
      createdAt: '2025-02-20T00:00:00Z',
      imageUrl: 'https://cdn.fineart.local/articles/event-hero.jpg',
      thumbnailUrl: 'https://cdn.fineart.local/articles/event-thumb.jpg',
    },
  ],
  [
    'seed-free',
    {
      id: 'seed-free',
      title: '거장 추천 전시 5선',
      content:
        '<p>주말에 가기 좋은 전시를 소개합니다. 지역별로 이동 동선을 정리했습니다.</p>',
      author: 'Community Host',
      category: 'free',
      createdAt: '2025-03-03T00:00:00Z',
      imageUrl: 'https://cdn.fineart.local/articles/free-hero.jpg',
      thumbnailUrl: 'https://cdn.fineart.local/articles/free-thumb.jpg',
    },
  ],
]);

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const buildImages = (payload) => {
  const images = Array.isArray(payload?.images) ? payload.images : [];
  const fallback = [payload?.imageUrl, payload?.thumbnailUrl].filter(Boolean);
  return [...new Set([...images, ...fallback])];
};

const readArticleId = (payload) => payload?.id ?? payload?.Id ?? payload?.ID ?? null;

const normalizeArticle = (payload) => {
  if (!payload) return null;
  const images = buildImages(payload);
  return {
    id: readArticleId(payload),
    title: payload.title ?? '제목 미확인',
    content: payload.content ?? '',
    author: payload.author ?? payload.writer ?? 'FineArt',
    category: payload.category ?? 'notice',
    createdAt: payload.createdAt ?? new Date().toISOString(),
    views: payload.views ?? 0,
    images,
    imageUrl: payload.imageUrl ?? images[0] ?? null,
    thumbnailUrl: payload.thumbnailUrl ?? images[1] ?? null,
  };
};

async function loadArticle(id) {
  try {
    const article = await getArticleById(id);
    return { article: normalizeArticle(article), isFallback: false };
  } catch (error) {
    console.error('[Article] Failed to fetch from API:', error);
    const fallback = normalizeArticle(FALLBACK_ARTICLES.get(id));
    return { article: fallback, isFallback: Boolean(fallback) };
  }
}

export default async function ArticleDetailPage(props) {
  const resolvedParams = await props.params;
  const routeId =
    typeof resolvedParams?.id === 'string'
      ? resolvedParams.id
      : Array.isArray(resolvedParams?.id)
        ? resolvedParams.id[0]
        : undefined;
  if (!routeId) {
    console.warn('[ArticleDetailPage] Missing route param id:', resolvedParams);
    notFound();
  }

  const { article, isFallback } = await loadArticle(routeId);

  if (!article) {
    notFound();
  }

  const heroImage = article.imageUrl ?? article.thumbnailUrl ?? article.images?.[0];
  const secondaryImages = (article.images ?? []).filter((img) => img !== heroImage);

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link href="/articles" className="text-sm text-primary">
        ← 목록으로
      </Link>

      {isFallback && (
        <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-800">{SERVER_OFFLINE_MESSAGE}</p>
      )}

      <article className="space-y-8 rounded-3xl border border-neutral-100 bg-white px-6 py-10 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-neutral-400">
            <span>{article.category}</span>
            <span className="text-neutral-300">/</span>
            <span>{article.author}</span>
          </div>
          <h1 className="text-4xl font-semibold text-neutral-900">{article.title}</h1>
          <p className="text-sm text-neutral-500">{formatDateTime(article.createdAt)}</p>
        </div>

        {heroImage && (
          <div className="overflow-hidden rounded-3xl border border-neutral-100">
            <img src={heroImage} alt={article.title} className="w-full object-cover" />
          </div>
        )}

        <div
          className="article-content space-y-6 text-base leading-7 text-neutral-800"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {secondaryImages.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {secondaryImages.map((image) => (
              <img
                key={image}
                src={image}
                alt={`${article.title} 이미지`}
                className="h-48 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500">
          <span>조회수 {article.views.toLocaleString('ko-KR')}</span>
          <span>ID #{article.id}</span>
        </div>

        <ArticleAdminActions articleId={article.id} />
      </article>
    </div>
  );
}

export function generateStaticParams() {
  return Array.from(FALLBACK_ARTICLES.keys()).map((id) => ({ id }));
}
