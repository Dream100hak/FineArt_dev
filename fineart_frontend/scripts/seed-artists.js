/**
 * Supabase 테스트 데이터 시드: 작가 10명 + 작가당 작품 2개
 * 실행: node scripts/seed-artists.js
 * (프로젝트 루트에서 .env.local 필요)
 */

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { resolve, dirname } = require('path');
const { pathToFileURL } = require('url');

function loadEnvLocal() {
  const path = resolve(__dirname, '../.env.local');
  try {
    const content = readFileSync(path, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const key = m[1].trim();
        const val = m[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    });
  } catch (e) {
    console.error('Could not load .env.local:', e.message);
    process.exit(1);
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// RLS 우회: SUPABASE_SERVICE_ROLE_KEY 사용 (있다면), 없으면 anon 키
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_ARTISTS = [
  { name: '김민수', slug: 'kim-minsu' },
  { name: '이하늘', slug: 'lee-haneul' },
  { name: '박지훈', slug: 'park-jihoon' },
  { name: '최수연', slug: 'choi-sooyeon' },
  { name: '정영호', slug: 'jung-youngho' },
  { name: '한서준', slug: 'han-seojun' },
  { name: '윤서아', slug: 'yoon-seoa' },
  { name: '임도현', slug: 'im-dohyun' },
  { name: '송예진', slug: 'song-yejin' },
  { name: '강준혁', slug: 'kang-junhyuk' },
];

const PICSUM = (seed, w = 400, h = 500) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function insertArtworks(artistId, slug) {
  const works = [
    { title: `${slug}-작품 1`, seed: `${slug}-1` },
    { title: `${slug}-작품 2`, seed: `${slug}-2` },
  ];

  for (const w of works) {
    const { error } = await supabase.from('artworks').insert({
      title: w.title,
      status: 'ForSale',
      price: 500000 + Math.floor(Math.random() * 1500000),
      artist_id: artistId,
      image_url: PICSUM(w.seed),
      description: `${w.title}입니다.`,
    });

    if (error) {
      console.warn(`  Artwork ${w.title}:`, error.message);
    }
  }
}

async function seed() {
  console.log('Seeding artists and artworks...');

  for (const a of TEST_ARTISTS) {
    const { data: artist, error: artistErr } = await supabase
      .from('artists')
      .insert({
        name: a.name,
        slug: a.slug,
        image_url: PICSUM(`artist-${a.slug}`),
        bio: `${a.name} 작가의 작품 세계를 만나보세요.`,
      })
      .select()
      .single();

    if (artistErr) {
      console.warn(`Artist ${a.name} may already exist:`, artistErr.message);
      const { data: existing } = await supabase
        .from('artists')
        .select('id')
        .eq('slug', a.slug)
        .single();
      if (!existing) {
        console.error('Failed to insert artist:', artistErr);
        continue;
      }
      await insertArtworks(existing.id, a.slug);
      continue;
    }

    await insertArtworks(artist.id, a.slug);
    console.log(`  + Artist: ${a.name}`);
  }

  console.log('Done.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
