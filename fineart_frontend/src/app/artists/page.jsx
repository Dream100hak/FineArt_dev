import Link from 'next/link';

import { loadArtistCatalog } from '@/lib/artistCatalog';



const SERVER_OFFLINE_MESSAGE = '서버 점검 중입니다. 잠시 후 다시 시도해 주세요.';



const formatDate = (value) => {

  if (!value) return '';

  try {

    return new Date(value).toLocaleDateString('ko-KR');

  } catch (error) {

    return value;

  }

};



export const revalidate = 0;



export default async function ArtistsPage() {

  const { catalog: artists, isFallback } = await loadArtistCatalog();



  const withPreview = artists.map((artist) => {

    const previewImage =

      artist.artworks?.find((artwork) => artwork.imageUrl)?.imageUrl ??

      artist.artworks?.[0]?.imageUrl ??

      '';

    return { ...artist, previewImage };

  });



  return (

    <div className="screen-padding section mx-auto flex w-full max-w-6xl flex-col gap-8">

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div className="space-y-2">

          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Artists</p>

          <h1 className="text-4xl font-semibold">FineArt 아카이브</h1>

          <p className="text-neutral-600">작가별 작품/전시/판매 현황을 한눈에 확인하세요.</p>

          {isFallback && (

            <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-800">{SERVER_OFFLINE_MESSAGE}</p>

          )}

        </div>


      </header>



      <section className="grid gap-6 md:grid-cols-3">

        {withPreview.map((artist) => (

          <Link

            key={artist.id}

            href={`/artists/${artist.slug}`}

            className="group overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"

          >

            <div className="relative h-56 w-full overflow-hidden rounded-t-3xl bg-gradient-to-br from-neutral-100 to-neutral-50">

              {artist.previewImage ? (

                <img

                  src={artist.previewImage}

                  alt={artist.name}

                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"

                  loading="lazy"

                />

              ) : (

                <div className="h-full w-full bg-gradient-to-br from-neutral-100 to-neutral-50" />

              )}

            </div>

            <div className="flex items-center justify-between px-6 pb-5 pt-4">

              <div>

                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">

                  {artist.nationality ?? 'Worldwide'}

                </p>

                <h2 className="text-xl font-semibold text-neutral-900">{artist.name}</h2>

              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">

                <span className="rounded-full bg-neutral-100 px-3 py-1">작품 {artist.artworkCount}</span>

                <span className="rounded-full bg-neutral-100 px-3 py-1">전시 {artist.exhibitionCount}</span>

              </div>

            </div>

          </Link>

        ))}

      </section>

    </div>

  );

}

