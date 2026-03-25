import { createClient } from './supabase';

// Legacy constants for compatibility
export const TOKEN_STORAGE_KEY = 'fineart_token';
export const TOKEN_COOKIE_KEY = 'fineart_token';
export const ROLE_STORAGE_KEY = 'fineart_role';
export const EMAIL_STORAGE_KEY = 'fineart_email';

// Helper function to get Supabase client
const getSupabase = () => {
  try {
    return createClient();
  } catch (error) {
    console.error('[API] Failed to create Supabase client:', error);
    throw new Error('Supabase client initialization failed. Please check environment variables.');
  }
};

// Helper function for error handling
const handleSupabaseError = (error, label) => {
  const message = error?.message ?? 'Unknown error';
  console.error(`[API] ${label} failed: ${message}`, error);
  throw error;
};

// Helper function to normalize ID
const normalizeId = (id) => {
  if (typeof id === 'number') return id.toString();
  if (typeof id === 'string') return id.trim();
  return '';
};

// Helper function for pagination
const applyPagination = (query, params = {}) => {
  const page = params.page ?? params.pageNumber ?? 1;
  const size = params.size ?? params.pageSize ?? 10;
  const from = (page - 1) * size;
  const to = from + size - 1;
  
  return query.range(from, to);
};

// Helper function for sorting
const applySorting = (query, sort) => {
  if (!sort) return query.order('created_at', { ascending: false });
  
  if (sort === 'order' || sort === 'order_index') {
    return query.order('order_index', { ascending: true });
  }
  
  if (sort === 'created_at' || sort === 'created') {
    return query.order('created_at', { ascending: false });
  }
  
  return query.order('created_at', { ascending: false });
};

const buildBoardSearchExpression = (keyword, searchField = 'all') => {
  const normalizedField = String(searchField || 'all').toLowerCase();
  if (normalizedField === 'writer') {
    return `writer.ilike.%${keyword}%,author.ilike.%${keyword}%`;
  }
  if (normalizedField === 'content') {
    return `content.ilike.%${keyword}%`;
  }
  if (normalizedField === 'title') {
    return `title.ilike.%${keyword}%`;
  }
  // all
  return `title.ilike.%${keyword}%,content.ilike.%${keyword}%,writer.ilike.%${keyword}%,author.ilike.%${keyword}%`;
};

// Helper function to convert camelCase to snake_case for database
const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

// Convert object keys from camelCase to snake_case
const camelToSnake = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = value;
  }
  return result;
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Convert object keys from snake_case to camelCase
const snakeToCamel = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = value;
  }
  return result;
};

// Legacy function for compatibility
export const clearStoredSession = () => {
  // This is now handled by Supabase Auth, but kept for compatibility
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage?.removeItem(ROLE_STORAGE_KEY);
    window.localStorage?.removeItem(EMAIL_STORAGE_KEY);
  } catch (error) {
    console.warn('[API] Unable to clear auth session:', error);
  }
};

// ============================================
// ARTICLES
// ============================================

const ARTICLE_SELECT_COLUMNS = [
  'id',
  'board_id',
  'title',
  'content',
  'writer',
  'author',
  'email',
  'guest_ip',
  'category',
  'view_count',
  'image_url',
  'thumbnail_url',
  'is_pinned',
  'created_at',
  'updated_at',
].join(', ');

export const getArticles = async (params = {}) => {
  try {
    const supabase = getSupabase();
    let query = supabase.from('articles').select(ARTICLE_SELECT_COLUMNS, { count: 'exact' });

    // Filter by category if provided
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Search by keyword if provided
    if (params.keyword || params.search) {
      const keyword = (params.keyword || params.search).toLowerCase();
      query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,author.ilike.%${keyword}%`);
    }

    // Apply sorting
    query = applySorting(query, params.sort);

    // Apply pagination
    query = applyPagination(query, params);

    const { data, error, count } = await query;

    if (error) throw error;

    // Convert snake_case to camelCase
    const normalizedData = snakeToCamel(data || []);

    return {
      items: normalizedData,
      total: count || 0,
      page: params.page ?? 1,
      size: params.size ?? params.pageSize ?? 10,
    };
  } catch (error) {
    handleSupabaseError(error, 'GET /api/articles');
  }
};

export const getArticleById = async (id) => {
  const normalizedId = normalizeId(id);
  if (!normalizedId) {
    console.warn('[API] getArticleById called without valid id:', id);
    throw new Error('Article id is required');
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_SELECT_COLUMNS)
      .eq('id', normalizedId)
      .single();

    if (error) throw error;
    
    // Convert snake_case to camelCase
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'GET /api/articles/:id');
  }
};

// ============================================
// ARTISTS
// ============================================

export const getArtists = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'GET /api/artists');
  }
};

// slug 자동 생성: 한글/공백을 URL 친화 문자열로
const slugFromName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `artist-${Date.now()}`;
};

export const createArtist = async (payload) => {
  try {
    const supabase = getSupabase();

    // DB 컬럼은 snake_case (name, slug, nationality, discipline, bio, image_url)
    const dbPayload = camelToSnake(payload);
    // 새 작가는 id 제거 → DB가 uuid_generate_v4()로 생성
    delete dbPayload.id;
    delete dbPayload.created_at;
    delete dbPayload.updated_at;

    // slug NOT NULL: 비어 있으면 name 기준으로 생성
    if (!dbPayload.slug || String(dbPayload.slug).trim() === '') {
      dbPayload.slug = slugFromName(dbPayload.name || payload.name) || `artist-${Date.now()}`;
    } else {
      dbPayload.slug = String(dbPayload.slug).trim().toLowerCase().replace(/\s+/g, '-');
    }

    const { data, error } = await supabase
      .from('artists')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'POST /api/artists');
  }
};

export const updateArtist = async (id, payload) => {
  if (!id) throw new Error('Artist id is required');
  
  try {
    const supabase = getSupabase();

    const dbPayload = camelToSnake(payload);
    delete dbPayload.id;
    delete dbPayload.created_at;
    delete dbPayload.updated_at;
    // slug가 비어 있으면 DB에 반영하지 않음 (NOT NULL 유지)
    if (dbPayload.slug === '' || dbPayload.slug == null) {
      delete dbPayload.slug;
    } else {
      dbPayload.slug = String(dbPayload.slug).trim().toLowerCase().replace(/\s+/g, '-');
    }

    const { data, error } = await supabase
      .from('artists')
      .update(dbPayload)
      .eq('id', normalizeId(id))
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'PUT /api/artists/:id');
  }
};

export const deleteArtist = async (id) => {
  if (!id) throw new Error('Artist id is required');
  
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('artists')
      .delete()
      .eq('id', normalizeId(id));

    if (error) throw error;
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'DELETE /api/artists/:id');
  }
};

// ============================================
// ARTWORKS
// ============================================

export const getArtworks = async (params = {}) => {
  try {
    const supabase = getSupabase();
    // 작가명 표시를 위해 artists 조인 (name만)
    let query = supabase.from('artworks').select('*, artists(name)', { count: 'exact' });

    // Filter by status if provided
    if (params.status) {
      query = query.eq('status', params.status);
    }

    // Filter by artist_id if provided
    if (params.artistId || params.artist_id) {
      query = query.eq('artist_id', params.artistId || params.artist_id);
    }

    // Search by keyword if provided
    if (params.keyword || params.search) {
      const keyword = (params.keyword || params.search).toLowerCase();
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    // Apply sorting
    query = applySorting(query, params.sort);

    // Apply pagination
    query = applyPagination(query, params);

    const { data, error, count } = await query;

    if (error) throw error;

    // 화면에서 imageUrl, mainTheme 등 camelCase 사용 → 변환 후 반환
    const items = (data || []).map((row) => {
      const item = snakeToCamel(row);
      // 조인된 작가명: artists(name) → artistName
      if (item.artists && typeof item.artists === 'object' && item.artists.name) {
        item.artistName = item.artists.name;
      }
      delete item.artists; // UI에는 artistName만 사용
      return item;
    });

    return {
      items,
      total: count || 0,
      page: params.page ?? params.pageNumber ?? 1,
      size: params.size ?? params.pageSize ?? 10,
    };
  } catch (error) {
    handleSupabaseError(error, 'GET /api/artworks');
  }
};

export const getArtworkById = async (id) => {
  const normalizedId = normalizeId(id);
  if (!normalizedId) {
    throw new Error('Artwork id is required');
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', normalizedId)
      .single();

    if (error) throw error;
    // camelCase로 반환 (imageUrl, mainTheme 등)
    return data ? snakeToCamel(data) : null;
  } catch (error) {
    handleSupabaseError(error, 'GET /api/artworks/:id');
  }
};

// artworks 테이블 컬럼: title, status, price, rent_price, is_rentable, artist_id, main_theme, material, size_bucket, size, width_cm, height_cm, image_url, description (+ id, created_at, updated_at)
const sanitizeArtworkPayload = (dbPayload, isCreate) => {
  delete dbPayload.artist_name;
  delete dbPayload.artist_slug;
  if (isCreate) {
    delete dbPayload.id;
    delete dbPayload.created_at;
    delete dbPayload.updated_at;
  } else {
    delete dbPayload.id;
    delete dbPayload.created_at;
    delete dbPayload.updated_at;
  }
  // NUMERIC 컬럼: 빈 문자열/undefined → null (DB 오류 방지)
  const numerics = ['price', 'rent_price', 'width_cm', 'height_cm'];
  numerics.forEach((key) => {
    const v = dbPayload[key];
    if (v === '' || v === undefined) {
      dbPayload[key] = null;
    } else if (typeof v === 'number' && !Number.isFinite(v)) {
      dbPayload[key] = null;
    }
  });
  // status NOT NULL: 빈 값이면 기본값
  if (!dbPayload.status || dbPayload.status === '') {
    dbPayload.status = 'ForSale';
  }
  return dbPayload;
};

export const createArtwork = async (payload) => {
  try {
    const supabase = getSupabase();
    const dbPayload = camelToSnake(payload);
    sanitizeArtworkPayload(dbPayload, true);

    const { data, error } = await supabase
      .from('artworks')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'POST /api/artworks');
  }
};

export const updateArtwork = async (id, payload) => {
  if (!id) throw new Error('Artwork id is required');
  
  try {
    const supabase = getSupabase();
    const dbPayload = camelToSnake(payload);
    sanitizeArtworkPayload(dbPayload, false);

    const { data, error } = await supabase
      .from('artworks')
      .update(dbPayload)
      .eq('id', normalizeId(id))
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'PUT /api/artworks/:id');
  }
};

export const deleteArtwork = async (id) => {
  if (!id) throw new Error('Artwork id is required');
  
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('artworks')
      .delete()
      .eq('id', normalizeId(id));

    if (error) throw error;
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'DELETE /api/artworks/:id');
  }
};

// ============================================
// EXHIBITIONS
// ============================================

export const getExhibitions = async (params = {}) => {
  try {
    const supabase = getSupabase();
    let query = supabase.from('exhibitions').select('*', { count: 'exact' });

    // Filter by category if provided
    if (params.category) {
      query = query.eq('category', params.category.toLowerCase());
    }

    // Filter by artist_id if provided
    if (params.artistId || params.artist_id) {
      query = query.eq('artist_id', params.artistId || params.artist_id);
    }

    // Search by keyword if provided
    if (params.keyword || params.search) {
      const keyword = (params.keyword || params.search).toLowerCase();
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,artist.ilike.%${keyword}%,location.ilike.%${keyword}%`);
    }

    // Apply sorting
    query = applySorting(query, params.sort);

    // Apply pagination
    query = applyPagination(query, params);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      items: data || [],
      total: count || 0,
      page: params.page ?? 1,
      size: params.size ?? 10,
    };
  } catch (error) {
    handleSupabaseError(error, 'GET /api/exhibitions');
  }
};

export const getExhibitionById = async (id) => {
  const normalizedId = normalizeId(id);
  if (!normalizedId) {
    console.warn('[API] getExhibitionById called without valid id:', id);
    throw new Error('Exhibition id is required');
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('id', normalizedId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'GET /api/exhibitions/:id');
  }
};

// Sanitize exhibition payload for DB (snake_case keys)
const sanitizeExhibitionPayload = (dbPayload, isCreate) => {
  delete dbPayload.artist_name;
  delete dbPayload.artist_slug;
  if (isCreate) {
    delete dbPayload.id;
    delete dbPayload.created_at;
    delete dbPayload.updated_at;
  }
  // category: CHECK constraint allows only specific values; empty string is invalid
  if (dbPayload.category === '' || dbPayload.category == null) {
    dbPayload.category = null;
  }
  // DATE columns: empty/invalid → null; ISO string → YYYY-MM-DD for PostgreSQL DATE
  const toDateOnly = (v) => {
    if (v === '' || v == null) return null;
    const s = String(v);
    if (s.includes('T')) return s.split('T')[0];
    return s;
  };
  dbPayload.start_date = toDateOnly(dbPayload.start_date);
  dbPayload.end_date = toDateOnly(dbPayload.end_date);
  // artist_id: empty string → null
  if (dbPayload.artist_id === '' || dbPayload.artist_id == null) {
    dbPayload.artist_id = null;
  }
  // Optional text fields: empty string → null (title is NOT NULL, leave as-is)
  ['artist', 'host', 'participants', 'location', 'description', 'image_url'].forEach((key) => {
    if (typeof dbPayload[key] === 'string' && dbPayload[key].trim() === '') {
      dbPayload[key] = null;
    }
  });
  return dbPayload;
};

export const createExhibition = async (payload) => {
  try {
    const supabase = getSupabase();
    const dbPayload = camelToSnake({ ...payload });
    sanitizeExhibitionPayload(dbPayload, true);

    const { data, error } = await supabase
      .from('exhibitions')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'POST /api/exhibitions');
  }
};

export const updateExhibition = async (id, payload) => {
  if (!id) throw new Error('Exhibition id is required');
  
  try {
    const supabase = getSupabase();
    const dbPayload = camelToSnake({ ...payload });
    sanitizeExhibitionPayload(dbPayload, false);
    delete dbPayload.id;

    const { data, error } = await supabase
      .from('exhibitions')
      .update(dbPayload)
      .eq('id', normalizeId(id))
      .select()
      .single();

    if (error) throw error;
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'PUT /api/exhibitions/:id');
  }
};

export const deleteExhibition = async (id) => {
  if (!id) throw new Error('Exhibition id is required');
  
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('exhibitions')
      .delete()
      .eq('id', normalizeId(id));

    if (error) throw error;
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'DELETE /api/exhibitions/:id');
  }
};

// ============================================
// BOARDS
// ============================================

export const getBoards = async (params = {}) => {
  try {
    const supabase = getSupabase();
    let query = supabase.from('boards').select('*', { count: 'exact' });

    // Filter by visibility (default: only visible)
    if (params.includeHidden !== true) {
      query = query.eq('is_visible', true);
    }

    // Apply sorting
    query = applySorting(query, params.sort);

    // Apply pagination if provided
    if (params.page || params.size) {
      query = applyPagination(query, params);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Convert snake_case to camelCase
    const normalizedData = snakeToCamel(data || []);

    // Return in expected format
    if (params.page || params.size) {
      return {
        items: normalizedData,
        total: count || 0,
        page: params.page ?? 1,
        size: params.size ?? 20,
      };
    }

    return normalizedData;
  } catch (error) {
    handleSupabaseError(error, 'GET /api/boards');
  }
};

export const getBoardsSidebar = async (params = {}) => {
  try {
    const supabase = getSupabase();
    let query = supabase.from('boards').select('*');

    // Only visible boards for sidebar
    query = query.eq('is_visible', true);

    // Order by order_index
    query = query.order('order_index', { ascending: true });

    const [{ data, error }, { data: tags, error: tagsError }] = await Promise.all([
      query,
      supabase.from('board_tags').select('name, order_index'),
    ]);

    if (error) throw error;
    if (tagsError) throw tagsError;

    // Convert snake_case to camelCase
    const normalizedBoards = snakeToCamel(data || []);

    const boards = normalizedBoards;
    const groupMap = new Map();

    boards.forEach((board) => {
      const groupName = (board.groupName ?? '').toString().trim() || '기타';
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, { children: [], groupOrder: Number(board.groupOrder ?? 0) });
      }
      const group = groupMap.get(groupName);
      group.children.push({ ...board, children: [] });
      group.groupOrder = Math.min(group.groupOrder, Number(board.groupOrder ?? 0));
    });

    const tagOrderMap = new Map((tags || []).map((tag) => [tag.name, Number(tag.order_index ?? 0)]));

    const groupedItems = Array.from(groupMap.entries())
      .sort(([aName, aData], [bName, bData]) => {
        const aOrder = tagOrderMap.get(aName) ?? aData.groupOrder ?? 0;
        const bOrder = tagOrderMap.get(bName) ?? bData.groupOrder ?? 0;
        const orderCompare = aOrder - bOrder;
        if (orderCompare !== 0) return orderCompare;
        return aName.localeCompare(bName, 'ko-KR');
      })
      .map(([groupName, groupData]) => ({
        id: `group-${groupName}`,
        name: groupName,
        slug: null,
        isGroup: true,
        groupOrder: groupData.groupOrder ?? 0,
        children: groupData.children.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
      }));

    return {
      items: groupedItems,
      total: boards.length,
    };
  } catch (error) {
    handleSupabaseError(error, 'GET /api/boards/sidebar');
  }
};

// ============================================
// BOARD TAGS
// ============================================

export const getBoardTags = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('board_tags')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return snakeToCamel(data || []);
  } catch (error) {
    handleSupabaseError(error, 'GET /api/board-tags');
  }
};

export const createBoardTag = async (payload) => {
  try {
    const supabase = getSupabase();
    const dbPayload = camelToSnake(payload);
    const { data, error } = await supabase
      .from('board_tags')
      .insert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'POST /api/board-tags');
  }
};

export const updateBoardTag = async (id, payload) => {
  if (!id) throw new Error('Board tag id is required');
  try {
    const supabase = getSupabase();
    const dbPayload = camelToSnake(payload);
    const { data, error } = await supabase
      .from('board_tags')
      .update(dbPayload)
      .eq('id', normalizeId(id))
      .select()
      .single();
    if (error) throw error;
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'PUT /api/board-tags/:id');
  }
};

export const deleteBoardTag = async (id) => {
  if (!id) throw new Error('Board tag id is required');
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('board_tags').delete().eq('id', normalizeId(id));
    if (error) throw error;
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'DELETE /api/board-tags/:id');
  }
};

// Helper to check if string is a valid UUID format
const isUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const getBoardBySlug = async (slugOrId) => {
  const normalized = slugOrId?.trim();
  if (!normalized) {
    throw new Error('Board identifier is required');
  }

  try {
    const supabase = getSupabase();
    let query = supabase.from('boards').select('*');
    
    // Check if it's a UUID or a slug
    if (isUUID(normalized)) {
      // It's a UUID, search by id
      query = query.eq('id', normalized);
    } else {
      // It's a slug, search by slug
      query = query.eq('slug', normalized);
    }
    
    const { data, error } = await query.single();

    if (error) throw error;
    
    // Convert snake_case to camelCase
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'GET /api/boards/:slug');
  }
};

export const getBoardArticles = async (slug, params = {}) => {
  if (!slug) {
    throw new Error('Board slug is required');
  }

  try {
    const supabase = getSupabase();
    
    // First get the board by slug
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('slug', slug)
      .single();

    if (boardError) throw boardError;
    if (!board) throw new Error('Board not found');

    const page = params.page ?? 1;
    const size = params.size ?? 12;
    const from = (page - 1) * size;
    const to = from + size - 1;

    // 공지는 모든 페이지 상단 고정으로 노출
    // (is_pinned=true 또는 category=notice)
    if (!params.category) {
      let noticesQuery = supabase
        .from('articles')
        .select(ARTICLE_SELECT_COLUMNS)
        .eq('board_id', board.id)
        .or('is_pinned.eq.true,category.eq.notice')
        .order('created_at', { ascending: false });

      let regularQuery = supabase
        .from('articles')
        .select(ARTICLE_SELECT_COLUMNS, { count: 'exact' })
        .eq('board_id', board.id)
        .neq('category', 'notice')
        .not('is_pinned', 'eq', true);

      // Search by keyword if provided
      if (params.keyword || params.search) {
        const keyword = (params.keyword || params.search).toLowerCase();
        const searchExpr = buildBoardSearchExpression(keyword, params.searchField);
        // 공지는 검색어와 무관하게 항상 상단 유지
        regularQuery = regularQuery.or(searchExpr);
      }

      // 일반글은 최신순 + 페이지네이션
      regularQuery = regularQuery.order('created_at', { ascending: false }).range(from, to);

      const [
        { data: notices, error: noticesError },
        { data: regularItems, error: regularError, count: regularCount },
      ] = await Promise.all([noticesQuery, regularQuery]);

      if (noticesError) throw noticesError;
      if (regularError) throw regularError;

      const merged = [...(notices || []), ...(regularItems || [])];
      const normalizedData = snakeToCamel(merged);

      return {
        items: normalizedData,
        // 페이지 수는 일반글 기준으로 계산
        total: regularCount || 0,
        page,
        size,
      };
    }

    // Then get articles for this board (카테고리 필터일 때 기본 동작)
    let query = supabase
      .from('articles')
      .select(ARTICLE_SELECT_COLUMNS, { count: 'exact' })
      .eq('board_id', board.id);

    // Filter by category if provided
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Search by keyword if provided
    if (params.keyword || params.search) {
      const keyword = (params.keyword || params.search).toLowerCase();
      const searchExpr = buildBoardSearchExpression(keyword, params.searchField);
      query = query.or(searchExpr);
    }

    // Apply sorting
    query = applySorting(query, params.sort);

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Convert snake_case to camelCase
    const normalizedData = snakeToCamel(data || []);

    return {
      items: normalizedData,
      total: count || 0,
      page,
      size,
    };
  } catch (error) {
    handleSupabaseError(error, 'GET /api/boards/:slug/articles');
  }
};

export const getBoardPageByDate = async (slug, targetDateTime, pageSize = 12) => {
  if (!slug) throw new Error('Board slug is required');
  if (!targetDateTime) throw new Error('Target datetime is required');

  try {
    const supabase = getSupabase();
    const date = new Date(targetDateTime);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid target datetime');
    }

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('slug', slug)
      .single();

    if (boardError) throw boardError;
    if (!board) throw new Error('Board not found');

    const { count, error: countError } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('board_id', board.id)
      .gt('created_at', date.toISOString());

    if (countError) throw countError;

    return Math.max(1, Math.floor((count || 0) / pageSize) + 1);
  } catch (error) {
    handleSupabaseError(error, 'GET /api/boards/:slug/articles/page-by-date');
  }
};

export const getBoardArticleById = async (slug, id) => {
  const normalizedId = normalizeId(id);
  if (!slug || !normalizedId) {
    throw new Error('Board slug and article id are required');
  }

  try {
    const supabase = getSupabase();
    
    // First get the board by slug
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('slug', slug)
      .single();

    if (boardError) throw boardError;
    if (!board) throw new Error('Board not found');

    // Increment view count via SECURITY DEFINER RPC (works under RLS).
    try {
      await supabase.rpc('increment_article_view', { p_article_id: normalizedId });
    } catch (viewError) {
      console.warn('[API] Failed to increment article view:', viewError);
    }

    // Then get the article
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_SELECT_COLUMNS)
      .eq('id', normalizedId)
      .eq('board_id', board.id)
      .single();

    if (error) throw error;
    return data ? snakeToCamel(data) : null;
  } catch (error) {
    handleSupabaseError(error, 'GET /api/boards/:slug/articles/:id');
  }
};

export const createBoard = async (payload) => {
  try {
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for database
    const dbPayload = camelToSnake(payload);
    
    // Handle parentId -> parent_id conversion (null or UUID)
    if (dbPayload.parent_id === null || dbPayload.parent_id === '') {
      dbPayload.parent_id = null;
    } else if (dbPayload.parent_id) {
      dbPayload.parent_id = normalizeId(dbPayload.parent_id);
    }
    
    const { data, error } = await supabase
      .from('boards')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw error;
    
    // Convert snake_case back to camelCase for response
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'POST /api/boards');
  }
};

export const updateBoard = async (id, payload) => {
  if (!id) throw new Error('Board id is required');
  
  try {
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for database
    const dbPayload = camelToSnake(payload);
    
    // Handle parentId -> parent_id conversion (null or UUID)
    if (dbPayload.parent_id === null || dbPayload.parent_id === '') {
      dbPayload.parent_id = null;
    } else if (dbPayload.parent_id) {
      dbPayload.parent_id = normalizeId(dbPayload.parent_id);
    }
    
    const { data, error } = await supabase
      .from('boards')
      .update(dbPayload)
      .eq('id', normalizeId(id))
      .select()
      .single();

    if (error) throw error;
    
    // Convert snake_case back to camelCase for response
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'PUT /api/boards/:id');
  }
};

export const deleteBoard = async (id) => {
  if (!id) throw new Error('Board id is required');
  
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', normalizeId(id));

    if (error) throw error;
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'DELETE /api/boards/:id');
  }
};

// ============================================
// ARTICLES (CRUD)
// ============================================

export const createArticle = async (payload) => {
  try {
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for database
    const dbPayload = camelToSnake(payload);
    
    // Handle boardId -> board_id conversion
    if (dbPayload.board_id) {
      dbPayload.board_id = normalizeId(dbPayload.board_id);
    }
    
    // thumbnail_url optional (null = frontend uses first image in content for list/gallery)
    // image_url, is_pinned — columns exist (see supabase_migrations/add_articles_thumbnail_image_pinned.sql)

    const { data, error } = await supabase
      .from('articles')
      .insert(dbPayload)
      .select(ARTICLE_SELECT_COLUMNS)
      .single();

    if (error) throw error;
    
    // Convert snake_case back to camelCase for response
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'POST /api/articles');
  }
};

export const createGuestArticle = async (payload) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('create_guest_article', {
      p_board_id: normalizeId(payload.boardId),
      p_title: payload.title,
      p_content: payload.content ?? '',
      p_writer: payload.writer ?? '익명',
      p_email: payload.email ?? null,
      p_category: payload.category ?? 'general',
      p_password: payload.password,
    });

    if (error) throw error;
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'RPC create_guest_article');
  }
};

export const updateArticle = async (id, payload) => {
  if (!id) throw new Error('Article id is required');
  
  try {
    const supabase = getSupabase();
    
    // Convert camelCase to snake_case for database
    const dbPayload = camelToSnake(payload);
    
    // Handle boardId -> board_id conversion if present
    if (dbPayload.board_id) {
      dbPayload.board_id = normalizeId(dbPayload.board_id);
    }
    
    // thumbnail_url optional; image_url, is_pinned stored in articles table

    const { data, error } = await supabase
      .from('articles')
      .update(dbPayload)
      .eq('id', normalizeId(id))
      .select(ARTICLE_SELECT_COLUMNS)
      .single();

    if (error) throw error;
    
    // Convert snake_case back to camelCase for response
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'PUT /api/articles/:id');
  }
};

export const updateGuestArticle = async (id, payload) => {
  if (!id) throw new Error('Article id is required');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('update_guest_article', {
      p_article_id: normalizeId(id),
      p_password: payload.password,
      p_title: payload.title,
      p_content: payload.content ?? '',
      p_writer: payload.writer ?? '익명',
      p_email: payload.email ?? null,
      p_category: payload.category ?? 'general',
    });

    if (error) throw error;
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'RPC update_guest_article');
  }
};

export const deleteArticle = async (id) => {
  if (!id) throw new Error('Article id is required');
  
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', normalizeId(id));

    if (error) throw error;
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'DELETE /api/articles/:id');
  }
};

export const deleteGuestArticle = async (id, password) => {
  if (!id) throw new Error('Article id is required');
  if (!password || !password.trim()) throw new Error('Password is required');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('delete_guest_article', {
      p_article_id: normalizeId(id),
      p_password: password.trim(),
    });

    if (error) throw error;
    return { success: Boolean(data) };
  } catch (error) {
    handleSupabaseError(error, 'RPC delete_guest_article');
  }
};

// ============================================
// ARTICLE COMMENTS
// ============================================
const COMMENT_SELECT_COLUMNS = [
  'id',
  'article_id',
  'parent_comment_id',
  'content',
  'writer',
  'author',
  'email',
  'guest_ip',
  'created_at',
  'updated_at',
].join(', ');

export const getArticleComments = async (articleId, params = {}) => {
  if (!articleId) throw new Error('Article id is required');

  try {
    const supabase = getSupabase();
    const page = params.page ?? 1;
    const size = params.size ?? 20;
    const from = (page - 1) * size;
    const to = from + size - 1;

    let query = supabase
      .from('article_comments')
      .select(COMMENT_SELECT_COLUMNS, { count: 'exact' })
      .eq('article_id', normalizeId(articleId))
      .order('created_at', { ascending: false })
      .range(from, to);

    // Top-level comments: parent_comment_id IS NULL (default)
    if (params.parentCommentId === undefined || params.parentCommentId === null) {
      query = query.is('parent_comment_id', null);
    } else {
      query = query.eq('parent_comment_id', normalizeId(params.parentCommentId));
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: snakeToCamel(data || []),
      total: count || 0,
      page,
      size,
    };
  } catch (error) {
    // 마이그레이션을 아직 적용하지 않은 환경(테이블 미존재)에서 앱이 깨지지 않게 처리
    const message = String(error?.message || '');
    const details = String(error?.details || '');
    const hint = String(error?.hint || '');
    const combined = `${message} ${details} ${hint}`.toLowerCase();
    const isMissingCommentsTable =
      combined.includes('article_comments')
      && (combined.includes('does not exist')
        || combined.includes('could not find the table')
        || combined.includes('schema cache')
        || combined.includes('relation'));

    if (isMissingCommentsTable) {
      console.warn('[API] Comments table is missing. Returning empty comments.', {
        articleId,
      });

      return {
        items: [],
        total: 0,
        page: params.page ?? 1,
        size: params.size ?? 20,
      };
    }

    handleSupabaseError(error, 'GET /api/articles/:id/comments');
  }
};

// Reply count (answers): parent_comment_id IS NOT NULL
export const getArticleRepliesTotal = async (articleId) => {
  if (!articleId) throw new Error('Article id is required');

  try {
    const supabase = getSupabase();

    const articleIdNorm = normalizeId(articleId);

    const { count, error } = await supabase
      .from('article_comments')
      .select('id', { count: 'exact' })
      .eq('article_id', articleIdNorm)
      .filter('parent_comment_id', 'not.is', null)
      .limit(0);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    const message = String(error?.message || '');
    const details = String(error?.details || '');
    const hint = String(error?.hint || '');
    const combined = `${message} ${details} ${hint}`.toLowerCase();

    const isMissingCommentsTable =
      combined.includes('article_comments')
      && (combined.includes('does not exist')
        || combined.includes('could not find the table')
        || combined.includes('schema cache')
        || combined.includes('relation'));

    if (isMissingCommentsTable) {
      console.warn('[API] Comments table is missing. Returning reply total as 0.', {
        articleId,
      });
      return 0;
    }

    handleSupabaseError(error, 'GET /api/articles/:id/comments/replies/total');
  }
};

// Total comments + replies (all rows in article_comments for the article)
export const getArticleCommentsTotal = async (articleId) => {
  if (!articleId) throw new Error('Article id is required');

  try {
    const supabase = getSupabase();

    const articleIdNorm = normalizeId(articleId);

    const { count, error } = await supabase
      .from('article_comments')
      .select('id', { count: 'exact' })
      .eq('article_id', articleIdNorm)
      .limit(0);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    const message = String(error?.message || '');
    const details = String(error?.details || '');
    const hint = String(error?.hint || '');
    const combined = `${message} ${details} ${hint}`.toLowerCase();

    const isMissingCommentsTable =
      combined.includes('article_comments')
      && (combined.includes('does not exist')
        || combined.includes('could not find the table')
        || combined.includes('schema cache')
        || combined.includes('relation'));

    if (isMissingCommentsTable) {
      console.warn('[API] Comments table is missing. Returning comments total as 0.', {
        articleId,
      });
      return 0;
    }

    handleSupabaseError(error, 'GET /api/articles/:id/comments/total');
  }
};

export const createComment = async (payload) => {
  try {
    const supabase = getSupabase();
    const dbPayload = camelToSnake(payload);

    if (dbPayload.article_id) {
      dbPayload.article_id = normalizeId(dbPayload.article_id);
    }
    if (dbPayload.parent_comment_id) {
      dbPayload.parent_comment_id = normalizeId(dbPayload.parent_comment_id);
    }

    const { data, error } = await supabase
      .from('article_comments')
      .insert(dbPayload)
      .select(COMMENT_SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'POST /api/articles/:id/comments');
  }
};

export const updateComment = async (commentId, payload) => {
  if (!commentId) throw new Error('Comment id is required');

  try {
    const supabase = getSupabase();
    const dbPayload = camelToSnake(payload);
    delete dbPayload.id;
    delete dbPayload.created_at;
    delete dbPayload.updated_at;

    const { data, error } = await supabase
      .from('article_comments')
      .update(dbPayload)
      .eq('id', normalizeId(commentId))
      .select(COMMENT_SELECT_COLUMNS)
      .single();

    if (error) throw error;
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'PUT /api/comments/:id');
  }
};

export const deleteComment = async (commentId) => {
  if (!commentId) throw new Error('Comment id is required');

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', normalizeId(commentId));

    if (error) throw error;
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'DELETE /api/comments/:id');
  }
};

export const createGuestComment = async (payload) => {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase.rpc('create_guest_article_comment', {
      p_article_id: normalizeId(payload.articleId),
      p_parent_comment_id:
        payload.parentCommentId === undefined || payload.parentCommentId === null
          ? null
          : normalizeId(payload.parentCommentId),
      p_content: payload.content ?? '',
      p_writer: payload.writer ?? '익명',
      p_email: payload.email ?? null,
      p_password: payload.password,
    });

    if (error) throw error;
    const normalized = snakeToCamel(data);
    return Array.isArray(normalized) ? normalized[0] : normalized;
  } catch (error) {
    handleSupabaseError(error, 'RPC create_guest_article_comment');
  }
};

export const updateGuestComment = async (commentId, payload) => {
  if (!commentId) throw new Error('Comment id is required');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('update_guest_article_comment', {
      p_comment_id: normalizeId(commentId),
      p_password: payload.password,
      p_content: payload.content ?? '',
      p_writer: payload.writer ?? '익명',
      p_email: payload.email ?? null,
    });

    if (error) throw error;
    const normalized = snakeToCamel(data);
    return Array.isArray(normalized) ? normalized[0] : normalized;
  } catch (error) {
    handleSupabaseError(error, 'RPC update_guest_article_comment');
  }
};

export const deleteGuestComment = async (commentId, password) => {
  if (!commentId) throw new Error('Comment id is required');
  if (!password || !password.trim()) throw new Error('Password is required');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('delete_guest_article_comment', {
      p_comment_id: normalizeId(commentId),
      p_password: password.trim(),
    });

    if (error) throw error;
    return { success: Boolean(data) };
  } catch (error) {
    handleSupabaseError(error, 'RPC delete_guest_article_comment');
  }
};

// ============================================
// FILE UPLOADS (Supabase Storage)
// ============================================

export const uploadFile = async (file, fieldName = 'file', bucket = 'artworks') => {
  if (!file) throw new Error('File is required for upload');

  try {
    const supabase = getSupabase();
    
    // Get current user for folder structure
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      ...data,
    };
  } catch (error) {
    handleSupabaseError(error, 'POST /api/uploads');
  }
};

export const uploadArticleImage = async (file, fieldName = 'file') => {
  return uploadFile(file, fieldName, 'articles');
};

// Default export for compatibility (legacy axios instance)
// This is kept for backward compatibility but will be removed
const legacyApi = {
  get: () => Promise.reject(new Error('Legacy API calls are deprecated. Use Supabase functions instead.')),
  post: () => Promise.reject(new Error('Legacy API calls are deprecated. Use Supabase functions instead.')),
  put: () => Promise.reject(new Error('Legacy API calls are deprecated. Use Supabase functions instead.')),
  delete: () => Promise.reject(new Error('Legacy API calls are deprecated. Use Supabase functions instead.')),
};

export default legacyApi;
