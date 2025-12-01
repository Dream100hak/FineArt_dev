import AdminArticlesClient from './AdminArticlesClient';

export const metadata = {
  title: '게시판 관리 · FineArt Admin',
};

export default function AdminArticlesPage({ searchParams }) {
  return <AdminArticlesClient initialArticleId={searchParams?.articleId ?? null} />;
}
