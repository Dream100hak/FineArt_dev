'use client';

const PREVIEW_CONFIG = {
  table: {
    label: '테이블형',
    pattern: (
      <div className="space-y-1 text-[10px] text-neutral-500">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex items-center justify-between rounded border border-neutral-200 px-2 py-1"
          >
            <span className="h-2 w-16 rounded bg-neutral-200" />
            <span className="h-2 w-8 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    ),
  },
  card: {
    label: '카드형',
    pattern: (
      <div className="grid grid-cols-3 gap-1">
        {[0, 1, 2].map((card) => (
          <div key={card} className="h-8 rounded border border-neutral-200 bg-neutral-50" />
        ))}
      </div>
    ),
  },
  list: {
    label: '리스트형',
    pattern: (
      <div className="space-y-1 text-[10px]">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded border border-neutral-200 px-2 py-1">
            <div className="h-2 w-20 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    ),
  },
  gallery: {
    label: '갤러리형',
    pattern: (
      <div className="grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-6 rounded bg-neutral-200" />
        ))}
      </div>
    ),
  },
  media: {
    label: '미디어형',
    pattern: (
      <div className="grid grid-cols-2 gap-1">
        {[0, 1].map((item) => (
          <div key={item} className="relative h-10 rounded bg-neutral-200">
            <span className="absolute left-1/2 top-1/2 block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-600" />
          </div>
        ))}
      </div>
    ),
  },
  timeline: {
    label: '타임라인형',
    pattern: (
      <div className="relative border-l border-neutral-300 pl-3 text-[10px] text-neutral-500">
        {[0, 1, 2].map((item) => (
          <div key={item} className="mb-1">
            <span className="absolute -left-[6px] mt-1 block h-2 w-2 rounded-full bg-neutral-600" />
            <div className="h-2 w-20 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    ),
  },
};

export default function LayoutPreview({ type }) {
  const preview = PREVIEW_CONFIG[type] ?? PREVIEW_CONFIG.card;
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/70 px-3 py-2 text-xs text-neutral-500">
      <p className="mb-1 font-semibold text-neutral-700">{preview.label}</p>
      {preview.pattern}
    </div>
  );
}
