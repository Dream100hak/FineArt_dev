import Link from 'next/link';

export default function ErrorState({ title = '문제가 발생했어요.', description = '잠시 후 다시 시도해 주세요.' }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
      <h2 className="text-xl font-semibold text-red-600">{title}</h2>
      <p className="text-sm text-red-500">{description}</p>
      <Link href="/" className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white">
        메인으로 이동
      </Link>
    </div>
  );
}
