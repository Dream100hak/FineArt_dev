'use client';

export default function BoardListControls({
  searchField,
  setSearchField,
  searchValue,
  setSearchValue,
  onSubmitSearch,
  onClearSearch,
  showPagination,
  pageButtons = [],
  currentPage = 1,
  totalPages = 1,
  onFirstPage,
  onPrevPage,
  onSelectPage,
  onNextPage,
  onLastPage,
  jumpDateTime,
  setJumpDateTime,
  onJumpToDate,
  jumpingByDate = false,
}) {
  return (
    <div className="space-y-3">
      <form
        className="flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:gap-3 bg-[var(--board-bg-secondary)]"
        style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSearch?.();
        }}
      >
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-[0.25em] font-medium">검색 기준</label>
          <select
            value={searchField}
            onChange={(event) => setSearchField(event.target.value)}
            className="rounded-xl border px-3 py-2 text-sm focus:outline-none bg-[var(--board-bg)]"
            style={{ borderColor: 'var(--board-border)', color: 'var(--board-text)' }}
          >
            <option value="all">전체</option>
            <option value="title">글 제목</option>
            <option value="content">글 내용</option>
            <option value="writer">작성자</option>
          </select>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="검색어를 입력하세요"
            className="flex-1 rounded-xl border px-4 py-2 text-sm focus:outline-none bg-[var(--board-bg)]"
            style={{ borderColor: 'var(--board-border)', color: 'var(--board-text)' }}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                if (onClearSearch) {
                  onClearSearch();
                  return;
                }
                setSearchValue('');
              }}
              className="rounded-full border px-4 py-2 text-sm transition hover:opacity-80"
              style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}
            >
              초기화
            </button>
          )}
          <button
            type="submit"
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm transition hover:border-neutral-900 hover:text-neutral-900"
          >
            검색
          </button>
        </div>
      </form>

      {showPagination && (
        <div className="space-y-3 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onFirstPage}
              className="rounded border border-neutral-200 px-3 py-1.5 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
              disabled={currentPage <= 1}
            >
              {'<<'}
            </button>
            <button
              type="button"
              onClick={onPrevPage}
              className="rounded border border-neutral-200 px-3 py-1.5 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
              disabled={currentPage <= 1}
            >
              {'<'}
            </button>
            {pageButtons.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onSelectPage(page)}
                className={`rounded border px-3 py-1.5 transition ${
                  page === currentPage
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={onNextPage}
              className="rounded border border-neutral-200 px-3 py-1.5 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
              disabled={currentPage >= totalPages}
            >
              {'>'}
            </button>
            <button
              type="button"
              onClick={onLastPage}
              className="rounded border border-neutral-200 px-3 py-1.5 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
              disabled={currentPage >= totalPages}
            >
              {'>>'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="datetime-local"
              value={jumpDateTime}
              onChange={(event) => setJumpDateTime(event.target.value)}
              className="rounded border border-neutral-200 px-3 py-1.5 text-sm focus:border-neutral-900 focus:outline-none bg-[var(--board-bg)]"
              style={{ color: 'var(--board-text)' }}
            />
            <button
              type="button"
              onClick={onJumpToDate}
              disabled={!jumpDateTime || jumpingByDate}
              className="rounded border border-neutral-200 px-3 py-1.5 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
            >
              {jumpingByDate ? '이동 중...' : '시간으로 바로가기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
