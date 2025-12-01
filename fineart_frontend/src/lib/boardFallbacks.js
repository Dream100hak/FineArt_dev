const baseDate = new Date('2025-01-01T00:00:00.000Z');

let fallbackIdCounter = 100000;
const nextFallbackId = () => `fallback-${fallbackIdCounter++}`;

const boardDefinitions = [
  {
    id: 1,
    slug: 'notice',
    name: 'Notice',
    description: 'Site and exhibition announcements',
    layoutType: 'table',
    orderIndex: 1,
    parentId: null,
  },
  {
    id: 2,
    slug: 'news',
    name: 'News',
    description: 'Art scene headlines',
    layoutType: 'card',
    orderIndex: 2,
    parentId: null,
  },
  {
    id: 3,
    slug: 'free',
    name: 'Community',
    description: 'Open discussion board',
    layoutType: 'table',
    orderIndex: 3,
    parentId: null,
  },
  {
    id: 4,
    slug: 'exhibition',
    name: 'Exhibitions',
    description: 'FineArt hosted events',
    layoutType: 'card',
    orderIndex: 4,
    parentId: null,
  },
  {
    id: 5,
    slug: 'recruit',
    name: 'Recruit',
    description: 'Art related hiring posts',
    layoutType: 'table',
    orderIndex: 5,
    parentId: null,
  },
  {
    id: 6,
    slug: 'artists-board',
    name: 'Artists',
    description: 'Interviews and spotlights',
    layoutType: 'card',
    orderIndex: 6,
    parentId: null,
  },
  {
    id: 7,
    slug: 'artworks-board',
    name: 'Artworks',
    description: 'Weekly picks and reviews',
    layoutType: 'card',
    orderIndex: 7,
    parentId: null,
  },
  {
    id: 8,
    slug: 'magazine',
    name: 'Magazine',
    description: 'FineArt magazine features',
    layoutType: 'card',
    orderIndex: 8,
    parentId: null,
  },
];

const boardLookup = boardDefinitions.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const createArticle = (overrides = {}) => ({
  id: overrides.id ?? nextFallbackId(),
  title: overrides.title ?? 'Untitled',
  content: overrides.content ?? '',
  writer: overrides.writer ?? overrides.author ?? 'FineArt',
  author: overrides.author ?? overrides.writer ?? 'FineArt',
  email: overrides.email ?? 'contact@fineart.local',
  category: overrides.category ?? 'notice',
  createdAt: overrides.createdAt ?? baseDate.toISOString(),
  updatedAt: overrides.updatedAt ?? overrides.createdAt ?? baseDate.toISOString(),
  views: overrides.views ?? Math.floor(Math.random() * 3000) + 10,
  ...overrides,
});

const boardArticles = {
  notice: [
    createArticle({
      id: 'notice-001',
      boardSlug: 'notice',
      category: 'notice',
      title: 'FineArt 2025 roadmap',
      content: 'The platform is expanding with new layouts, events, and better moderation tools.',
      writer: 'FineArt Ops',
      author: 'FineArt Ops',
    }),
    createArticle({
      id: 'notice-002',
      boardSlug: 'notice',
      category: 'notice',
      title: 'February maintenance',
      content: 'Service downtime is scheduled for Feb 14 00:00–04:00 KST.',
      writer: 'FineArt Ops',
      author: 'FineArt Ops',
    }),
  ],
  news: [
    createArticle({
      id: 'news-001',
      boardSlug: 'news',
      category: 'news',
      title: 'Asia art fair report',
      content: 'Highlights from winter fairs and what collectors were chasing.',
      writer: 'Newsroom',
      author: 'Newsroom',
    }),
  ],
  free: [
    createArticle({
      id: 'free-001',
      boardSlug: 'free',
      category: 'community',
      title: 'First hello',
      content: 'New member saying hi to everyone!',
      writer: 'neo',
      author: 'neo',
    }),
  ],
  exhibition: [
    createArticle({
      id: 'exhibition-001',
      boardSlug: 'exhibition',
      category: 'event',
      title: 'Spring curation program',
      content: 'Join the immersive exhibition with five media artists.',
      writer: 'FineArt Studio',
      author: 'FineArt Studio',
    }),
  ],
  recruit: [
    createArticle({
      id: 'recruit-001',
      boardSlug: 'recruit',
      category: 'recruit',
      title: 'Exhibition manager opening',
      content: 'FineArt is hiring a seasonal exhibition manager. Apply today.',
      writer: 'FineArt HR',
      author: 'FineArt HR',
    }),
  ],
  'artists-board': [
    createArticle({
      id: 'artists-001',
      boardSlug: 'artists-board',
      category: 'feature',
      title: 'Artist spotlight: Minah Cho',
      content: 'A look at Minah Cho’s latest “Light City” series.',
      writer: 'Editor J',
      author: 'Editor J',
    }),
  ],
  'artworks-board': [
    createArticle({
      id: 'artworks-001',
      boardSlug: 'artworks-board',
      category: 'review',
      title: 'Weekly picks: abstract gradients',
      content: 'Three monochrome pieces that quietly evolve through light.',
      writer: 'Community Host',
      author: 'Community Host',
    }),
  ],
  magazine: [
    createArticle({
      id: 'magazine-001',
      boardSlug: 'magazine',
      category: 'magazine',
      title: 'FineArt Magazine Vol.01',
      content: 'Interviews, reviews, and behind-the-scenes notes from the curation team.',
      writer: 'Magazine Editor',
      author: 'Magazine Editor',
    }),
  ],
};

export const buildFallbackBoardsPayload = () => {
  const items = boardDefinitions
    .map((meta) => ({
      id: meta.id,
      name: meta.name,
      slug: meta.slug,
      description: meta.description,
      layoutType: meta.layoutType,
      orderIndex: meta.orderIndex,
      parentId: meta.parentId,
      isVisible: true,
      createdAt: baseDate.toISOString(),
      updatedAt: baseDate.toISOString(),
      articleCount: (boardArticles[meta.slug] ?? []).length,
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    items,
    total: items.length,
    page: 1,
    size: items.length,
    isFallback: true,
  };
};

export const buildFallbackSidebarTree = () => {
  const boards = buildFallbackBoardsPayload().items;
  const lookup = boards.reduce((acc, board) => {
    const key = board.parentId ?? 'root';
    acc[key] = acc[key] ?? [];
    acc[key].push(board);
    return acc;
  }, {});

  const build = (parentKey = 'root') =>
    (lookup[parentKey] ?? [])
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((board) => ({
        ...board,
        children: build(board.id),
      }));

  return build();
};

export const getFallbackBoard = (slug) => {
  if (!slug) return null;
  const meta = boardLookup[slug];
  if (!meta) return null;

  return {
    id: meta.id,
    name: meta.name,
    slug: meta.slug,
    description: meta.description,
    layoutType: meta.layoutType,
    orderIndex: meta.orderIndex,
    parentId: meta.parentId,
    isVisible: true,
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
    articleCount: (boardArticles[meta.slug] ?? []).length,
    isFallback: true,
  };
};

export const getFallbackArticlesPayload = (slug) => {
  if (!slug) {
    return {
      board: null,
      items: [],
      total: 0,
      page: 1,
      size: 12,
      isFallback: true,
    };
  }

  const normalized = slug.toLowerCase();
  const items = (boardArticles[normalized] ?? []).map((item) => ({
    ...item,
    boardSlug: normalized,
  }));

  return {
    board: getFallbackBoard(normalized),
    items,
    total: items.length,
    page: 1,
    size: Math.max(1, items.length || 12),
    isFallback: true,
  };
};

export const findFallbackArticle = (slug, articleId) => {
  if (!slug || !articleId) return null;
  const normalized = slug.toLowerCase();
  const article = (boardArticles[normalized] ?? []).find(
    (item) => String(item.id) === String(articleId),
  );
  if (!article) return null;

  return {
    ...article,
    Board: getFallbackBoard(normalized),
  };
};
