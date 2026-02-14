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

export const getArticles = async (params = {}) => {
  try {
    const supabase = getSupabase();
    let query = supabase.from('articles').select('*', { count: 'exact' });

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
      .select('*')
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

export const createArtist = async (payload) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('artists')
      .insert(payload)
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
    const { data, error } = await supabase
      .from('artists')
      .update(payload)
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
    let query = supabase.from('artworks').select('*', { count: 'exact' });

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

    return {
      items: data || [],
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
    return data;
  } catch (error) {
    handleSupabaseError(error, 'GET /api/artworks/:id');
  }
};

export const createArtwork = async (payload) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('artworks')
      .insert(payload)
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
    const { data, error } = await supabase
      .from('artworks')
      .update(payload)
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

export const createExhibition = async (payload) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('exhibitions')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'POST /api/exhibitions');
  }
};

export const updateExhibition = async (id, payload) => {
  if (!id) throw new Error('Exhibition id is required');
  
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('exhibitions')
      .update(payload)
      .eq('id', normalizeId(id))
      .select()
      .single();

    if (error) throw error;
    return data;
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

    const { data, error } = await query;

    if (error) throw error;

    // Convert snake_case to camelCase
    const normalizedBoards = snakeToCamel(data || []);

    // Build tree structure (parent-child relationships)
    const boards = normalizedBoards;
    const boardMap = new Map();
    const rootBoards = [];

    // First pass: create map
    boards.forEach((board) => {
      boardMap.set(board.id, { ...board, children: [] });
    });

    // Second pass: build tree (use camelCase parentId after normalization)
    boards.forEach((board) => {
      const boardNode = boardMap.get(board.id);
      if (board.parentId && boardMap.has(board.parentId)) {
        boardMap.get(board.parentId).children.push(boardNode);
      } else {
        rootBoards.push(boardNode);
      }
    });

    return {
      items: rootBoards,
      total: boards.length,
    };
  } catch (error) {
    handleSupabaseError(error, 'GET /api/boards/sidebar');
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

    // Then get articles for this board
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('board_id', board.id);

    // Filter by category if provided
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Search by keyword if provided
    if (params.keyword || params.search) {
      const keyword = (params.keyword || params.search).toLowerCase();
      query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
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
      size: params.size ?? 12,
    };
  } catch (error) {
    handleSupabaseError(error, 'GET /api/boards/:slug/articles');
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

    // Then get the article
    const { data, error } = await supabase
      .from('articles')
      .select('*')
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
      .select()
      .single();

    if (error) throw error;
    
    // Convert snake_case back to camelCase for response
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'POST /api/articles');
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
      .select()
      .single();

    if (error) throw error;
    
    // Convert snake_case back to camelCase for response
    return snakeToCamel(data);
  } catch (error) {
    handleSupabaseError(error, 'PUT /api/articles/:id');
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
