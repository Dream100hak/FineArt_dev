/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
};

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const buildExcerpt = (content, limit = 160) => {
  const plain = stripHtml(content);
  if (plain.length <= limit) return plain;
  return `${plain.slice(0, limit)}…`;
};

export default function ArticleCard({ article }) {
  const thumbnail = article.thumbnailUrl || article.imageUrl || article.images?.[1];

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg">
      {thumbnail && (
        <div className="relative h-48 overflow-hidden rounded-2xl bg-neutral-100">
          <img
            src={thumbnail}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-400">
        <span>{article.author ?? 'FineArt'}</span>
        <span>{formatDate(article.createdAt)}</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-neutral-900">{article.title}</h2>
        <p className="text-sm text-neutral-600">{buildExcerpt(article.content)}</p>
      </div>
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span className="rounded-full border border-neutral-200 px-3 py-1 text-[11px] uppercase tracking-widest">
          {article.category ?? 'article'}
        </span>
        <Link href={`/articles/${article.id}`} className="text-primary underline-offset-4 hover:underline">
          자세히 보기
        </Link>
      </div>
    </article>
  );
}
