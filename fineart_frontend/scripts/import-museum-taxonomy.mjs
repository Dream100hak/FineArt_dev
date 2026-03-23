import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env.local');
const TAXONOMY_CANDIDATES = [
  path.join(ROOT, 'data', 'museums-taxonomy.json'),
  path.join(ROOT, 'data', 'galleries-taxonomy.json'),
];

const parseEnv = (raw) => {
  const env = {};
  raw.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx < 0) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  });
  return env;
};

const inferType = (name = '') => {
  const normalized = name.toLowerCase();
  if (name.includes('재단') || normalized.includes('foundation')) return 'foundation';
  if (name.includes('미술관')) return 'museum';
  if (name.includes('박물관') || normalized.includes('museum')) return 'heritage';
  if (name.includes('아트스페이스') || normalized.includes('artspace') || normalized.includes('art space')) return 'art_space';
  if (name.includes('프로젝트') || normalized.includes('project')) return 'project_space';
  if (name.includes('갤러리') || normalized.includes('gallery') || name.includes('화랑')) return 'gallery';
  if (name.includes('아트센터') || name.includes('문화센터') || name.includes('센터')) return 'alternative';
  return 'other';
};

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const toRows = (json) => {
  const rows = [];
  const regions = Array.isArray(json?.regions) ? json.regions : [];
  regions.forEach((region) => {
    const districts = Array.isArray(region.districts) ? region.districts : [];
    districts.forEach((district) => {
      const neighborhoods = Array.isArray(district.neighborhoods) ? district.neighborhoods : [];
      neighborhoods.forEach((neighborhood) => {
        const venues = Array.isArray(neighborhood.venues) ? neighborhood.venues : [];
        venues.forEach((venue) => {
          const name = normalize(venue.name);
          if (!name) return;
          rows.push({
            external_id:
              normalize(venue.gno) ||
              `${normalize(region.id)}-${normalize(district.key)}-${normalize(neighborhood.key)}-${name}`.replace(/\s+/g, '-'),
            name,
            type: inferType(name),
            phone: normalize(venue.phone) || null,
            email: normalize(venue.email) || null,
            homepage: normalize(venue.homepage) || null,
            address: normalize(venue.address) || null,
            detail_info: normalize(venue.detailInfo) || null,
            major: normalize(region.name) || null,
            district: normalize(district.name) || null,
            neighborhood: normalize(neighborhood.name) || null,
            source_area: normalize(venue.sources?.[0]?.areaLabel) || null,
            metadata: {
              taxonomy: venue.taxonomy ?? null,
              sources: venue.sources ?? [],
              importedAt: new Date().toISOString(),
            },
          });
        });
      });
    });
  });
  return rows;
};

const chunk = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

async function resolveTaxonomyPath() {
  for (const candidate of TAXONOMY_CANDIDATES) {
    try {
      await readFile(candidate, 'utf-8');
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error('taxonomy file not found in data/museums-taxonomy.json or data/galleries-taxonomy.json');
}

async function main() {
  const envRaw = await readFile(ENV_PATH, 'utf-8');
  const env = parseEnv(envRaw);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }

  const taxonomyPath = await resolveTaxonomyPath();
  const raw = await readFile(taxonomyPath, 'utf-8');
  const json = JSON.parse(raw);
  const rows = toRows(json);
  const groups = chunk(rows, 200);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let processed = 0;
  for (const [index, group] of groups.entries()) {
    const { error } = await supabase.from('museum_spaces').upsert(group, {
      onConflict: 'external_id',
      ignoreDuplicates: false,
    });
    if (error) {
      throw new Error(`Batch ${index + 1}/${groups.length} failed: ${error.message}`);
    }
    processed += group.length;
    console.log(`Imported ${processed}/${rows.length}`);
  }

  console.log(`Done. Imported ${rows.length} rows from ${path.basename(taxonomyPath)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

