import AdminBoardsClient from './AdminBoardsClient';

export const metadata = {
  title: '게시판 관리 · FineArt Admin',
  description: '게시판 생성, 설정, 순서를 관리합니다.',
};

export default function AdminBoardsPage() {
  return <AdminBoardsClient />;
}
