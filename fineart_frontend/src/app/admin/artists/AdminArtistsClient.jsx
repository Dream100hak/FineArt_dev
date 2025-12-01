
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiEdit3, FiImage, FiPlus, FiRefreshCcw, FiTrash2 } from 'react-icons/fi';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import {
  createArtist,
  createArtwork,
  createExhibition,
  deleteArtist,
  deleteArtwork,
  deleteExhibition,
  getArtists,
  getArtworks,
  getArtworkById,
  getExhibitions,
  updateArtist,
  updateArtwork,
  updateExhibition,
  uploadArticleImage,
} from '@/lib/api';

const emptyArtist = {
  id: null,
  name: '',
  slug: '',
  nationality: '대한민국',
  discipline: '',
  bio: '',
};

const emptyArtwork = {
  id: null,
  title: '',
  status: 'ForSale',
  price: '',
  artistName: '',
  artistId: null,
  artistSlug: null,
  mainTheme: '',
  material: '',
  sizeBucket: '',
  size: '',
  widthCm: '',
  heightCm: '',
  imageUrl: '',
  description: '',
  isRentable: false,
  rentPrice: '',
};

const emptyExhibition = {
  id: null,
  title: '',
  artist: '',
  artistName: '',
  artistId: null,
  artistSlug: null,
  location: '',
  startDate: '',
  endDate: '',
  description: '',
  imageUrl: '',
  category: '',
};

const STATUS_OPTIONS = [
  { value: 'ForSale', label: '판매 중' },
  { value: 'Sold', label: '판매 완료' },
  { value: 'Rentable', label: '렌탈 가능' },
];

const MATERIAL_OPTIONS = ['유화', '수채화', '아크릴', '혼합재료', '드로잉', '판화', '사진'];
const SIZE_OPTIONS = ['10호 미만', '10호대', '20호대', '30호대', '50호대', '80호 이상'];
const THEME_OPTIONS = ['인물', '풍경', '추상', '동물', '도시', '자연', '개념', '기타'];
const COUNTRY_OPTIONS = ['대한민국', '미국', '영국', '프랑스', '일본', '중국', '독일', '기타'];
const EXHIBITION_CATEGORIES = [
  { value: 'Group', label: '그룹' },
  { value: 'Solo', label: '개인전' },
  { value: 'Digital', label: '디지털' },
  { value: 'Installation', label: '설치' },
  { value: 'Media', label: '미디어' },
  { value: 'Concept', label: '개념' },
  { value: 'Other', label: '기타' },
];

const unwrapList = (res) => res?.items || res || [];
const normalizeArtist = (item) => ({
  id: item?.id ?? item?.Id ?? null,
  name: item?.name ?? item?.Name ?? '',
  slug: item?.slug ?? item?.Slug ?? '',
  nationality: item?.nationality ?? item?.Nationality ?? '대한민국',
  discipline: item?.discipline ?? item?.Discipline ?? '',
  bio: item?.bio ?? item?.Bio ?? '',
});

const normalizeArtwork = (item) => ({
  id: item?.id ?? item?.Id ?? null,
  title: item?.title || item?.Title || '',
  status: item?.status || item?.Status || 'ForSale',
  price: item?.price ?? item?.Price ?? '',
  artistName: item?.artistName || item?.artist || item?.Artist || '',
  artistId: item?.artistId ?? item?.ArtistId ?? null,
  artistSlug: item?.artistSlug ?? item?.ArtistSlug ?? item?.slug ?? null,
  mainTheme: item?.mainTheme || item?.MainTheme || item?.theme || '',
  material: item?.material || item?.Material || '',
  sizeBucket: item?.sizeBucket || item?.SizeBucket || '',
  size: item?.size || item?.Size || '',
  widthCm: item?.widthCm ?? item?.WidthCm ?? '',
  heightCm: item?.heightCm ?? item?.HeightCm ?? '',
  imageUrl: item?.imageUrl || item?.ImageUrl || '',
  description: item?.description || item?.Description || '',
  isRentable: Boolean(item?.isRentable ?? item?.IsRentable),
  rentPrice: item?.rentPrice ?? item?.RentPrice ?? '',
});

const toDateInputValue = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};
const toIsoDate = (v) => (v ? new Date(v).toISOString() : undefined);
const toNumberOrUndefined = (v) => {
  if (v === '' || v === null || v === undefined) return undefined;
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
};
const extractUploadUrl = (res) => res?.data?.url || res?.url || res;

const normalizeExhibition = (item) => ({
  id: item?.id ?? item?.Id ?? null,
  title: item?.title || item?.Title || '',
  artist: item?.artist || item?.Artist || '',
  artistName: item?.artistName || item?.artist || item?.Artist || '',
  artistId: item?.artistId ?? item?.ArtistId ?? null,
  artistSlug: item?.artistSlug ?? item?.ArtistSlug ?? item?.slug ?? null,
  location: item?.location || item?.Location || '',
  startDate: toDateInputValue(item?.startDate || item?.StartDate),
  endDate: toDateInputValue(item?.endDate || item?.EndDate),
  description: item?.description || item?.Description || '',
  imageUrl: item?.imageUrl || item?.ImageUrl || '',
  category: item?.category || item?.Category || '',
});

export default function AdminArtistsClient() {
  const { isAdmin } = useDecodedAuth();

  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);

  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const [selectedArtworkId, setSelectedArtworkId] = useState(null);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState(null);

  const [artistForm, setArtistForm] = useState(emptyArtist);
  const [artworkForm, setArtworkForm] = useState(emptyArtwork);
  const [exhibitionForm, setExhibitionForm] = useState(emptyExhibition);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const [uploadingExhibition, setUploadingExhibition] = useState(false);

  const [creatingArtistMode, setCreatingArtistMode] = useState(false);

  const artworkFileInputRef = useRef(null);
  const exhibitionFileInputRef = useRef(null);

  const selectedArtist = useMemo(
    () => artists.find((a) => a.id === selectedArtistId) || null,
    [artists, selectedArtistId],
  );
  const filteredArtworks = useMemo(() => {
    if (!selectedArtist) return [];
    const { name, id, slug } = selectedArtist;
    return artworks.filter((art) => art.artistName === name || art.artistId === id || art.artistSlug === slug);
  }, [artworks, selectedArtist]);

  const filteredExhibitions = useMemo(() => {
    if (!selectedArtist) return exhibitions;
    const normalize = (v) => (v ? String(v).trim().toLowerCase() : '');
    const artistNameKey = normalize(selectedArtist.name);
    const artistIdKey = normalize(selectedArtist.id);
    const artistSlugKey = normalize(selectedArtist.slug);

    return exhibitions.filter((ex) => {
      const exName = normalize(ex.artistName || ex.artist);
      const exId = normalize(ex.artistId);
      const exSlug = normalize(ex.artistSlug);
      return exName === artistNameKey || exId === artistIdKey || (exSlug && exSlug === artistSlugKey);
    });
  }, [exhibitions, selectedArtist]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [artistRes, artworkRes, exhibitionRes] = await Promise.all([
        getArtists(),
        getArtworks(),
        getExhibitions({ page: 1, size: 500 }),
      ]);
      const nextArtists = unwrapList(artistRes).map(normalizeArtist);
      setArtists(nextArtists);
      setArtworks(unwrapList(artworkRes).map(normalizeArtwork));
      setExhibitions(unwrapList(exhibitionRes).map(normalizeExhibition));

      if (!selectedArtistId && nextArtists.length && !creatingArtistMode) {
        const first = nextArtists[0];
        setSelectedArtistId(first.id);
        setArtistForm({
          id: first.id,
          name: first.name || '',
          slug: first.slug || '',
          nationality: first.nationality || '대한민국',
          discipline: first.discipline || '',
          bio: first.bio || '',
        });
      }
      setMessage('');
    } catch (err) {
      console.error(err);
      setMessage('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedArtistId, creatingArtistMode]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const resetFormsForArtist = useCallback(
    (artist) => {
      setCreatingArtistMode(false);
      setArtistForm({
        id: artist?.id ?? null,
        name: artist?.name || '',
        slug: artist?.slug || '',
        nationality: artist?.nationality || '대한민국',
        discipline: artist?.discipline || '',
        bio: artist?.bio || '',
      });
      setArtworkForm({
        ...emptyArtwork,
        artistName: artist?.name || '',
        artistId: artist?.id || null,
        artistSlug: artist?.slug || null,
      });
      setSelectedArtworkId(null);
      setExhibitionForm({
        ...emptyExhibition,
        artistName: artist?.name || '',
        artistId: artist?.id || null,
        artistSlug: artist?.slug || null,
      });
      setSelectedExhibitionId(null);
    },
    [],
  );

  const handleSelectArtist = useCallback(
    (artist) => {
      setCreatingArtistMode(false);
      setSelectedArtistId(artist?.id || null);
      resetFormsForArtist(artist);
    },
    [resetFormsForArtist],
  );

  const handleArtistSubmit = async (e) => {
    e.preventDefault();
    if (!artistForm.name.trim()) {
      setMessage('작가 이름을 입력해주세요.');
      return;
    }
    try {
      setLoading(true);
      if (selectedArtistId) {
        await updateArtist(selectedArtistId, artistForm);
        setMessage('작가 정보가 수정되었습니다.');
      } else {
        const created = await createArtist(artistForm);
        setCreatingArtistMode(false);
        setSelectedArtistId(created?.id ?? created?.Id ?? null);
        setMessage('작가가 생성되었습니다.');
      }
      await loadAll();
    } catch (err) {
      console.error(err);
      setMessage('작가 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleArtistDelete = async () => {
    if (!selectedArtistId) return;
    if (!window.confirm('해당 작가를 삭제하시겠습니까?')) return;
    try {
      setLoading(true);
      await deleteArtist(selectedArtistId);
      setMessage('작가가 삭제되었습니다.');
      setCreatingArtistMode(false);
      setSelectedArtistId(null);
      setArtistForm(emptyArtist);
      setArtworkForm(emptyArtwork);
      setExhibitionForm(emptyExhibition);
      await loadAll();
    } catch (err) {
      console.error(err);
      setMessage('작가 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  const handleArtworkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedArtist) {
      setMessage('작가를 먼저 선택해주세요.');
      return;
    }
    if (!artworkForm.title.trim()) {
      setMessage('작품명을 입력해주세요.');
      return;
    }

    const payload = {
      ...artworkForm,
      artistName: selectedArtist.name,
      artistId: selectedArtist.id,
      artistSlug: selectedArtist.slug,
      price: toNumberOrUndefined(artworkForm.price),
      rentPrice: toNumberOrUndefined(artworkForm.rentPrice),
      widthCm: toNumberOrUndefined(artworkForm.widthCm),
      heightCm: toNumberOrUndefined(artworkForm.heightCm),
      sizeBucket: (artworkForm.sizeBucket || '').trim(),
      size: (artworkForm.size || '').trim(),
      isRentable: Boolean(artworkForm.isRentable),
    };

    try {
      setLoading(true);
      if (selectedArtworkId) {
        await updateArtwork(selectedArtworkId, payload);
        setMessage('작품이 수정되었습니다.');
      } else {
        await createArtwork(payload);
        setMessage('작품이 등록되었습니다.');
      }
      const fetched = await getArtworks();
      setArtworks(unwrapList(fetched).map(normalizeArtwork));
      setArtworkForm({
        ...emptyArtwork,
        artistName: selectedArtist.name,
        artistId: selectedArtist.id,
        artistSlug: selectedArtist.slug,
      });
      setSelectedArtworkId(null);
    } catch (err) {
      console.error(err);
      setMessage('작품 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleArtworkEdit = async (art) => {
    setSelectedArtworkId(art.id);
    const latest = await getArtworkById(art.id);
    setArtworkForm(normalizeArtwork(latest));
  };

  const handleArtworkDelete = async (art) => {
    if (!window.confirm('작품을 삭제하시겠습니까?')) return;
    try {
      setLoading(true);
      await deleteArtwork(art.id);
      setMessage('작품이 삭제되었습니다.');
      const fetched = await getArtworks();
      setArtworks(unwrapList(fetched).map(normalizeArtwork));
      setArtworkForm({ ...emptyArtwork, artistName: selectedArtist?.name || '' });
      setSelectedArtworkId(null);
    } catch (err) {
      console.error(err);
      setMessage('작품 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleArtworkFileUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingArtwork(true);
      const res = await uploadArticleImage(file);
      const url = extractUploadUrl(res);
      setArtworkForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error(err);
      setMessage('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingArtwork(false);
    }
  };
  const handleExhibitionSubmit = async (e) => {
    e.preventDefault();
    if (!exhibitionForm.title.trim()) {
      setMessage('전시명을 입력해주세요.');
      return;
    }

    const artistNamePayload = selectedArtist
      ? selectedArtist.name
      : exhibitionForm.artistName || exhibitionForm.artist || '';

    const payload = {
      ...exhibitionForm,
      artist: artistNamePayload,
      artistName: artistNamePayload,
      artistId: selectedArtist?.id ?? null,
      artistSlug: selectedArtist?.slug ?? null,
      startDate: toIsoDate(exhibitionForm.startDate),
      endDate: toIsoDate(exhibitionForm.endDate),
    };

    try {
      setLoading(true);
      if (selectedExhibitionId) {
        await updateExhibition(selectedExhibitionId, payload);
        setMessage('전시가 수정되었습니다.');
      } else {
        await createExhibition(payload);
        setMessage('전시가 등록되었습니다.');
      }
      const fetched = await getExhibitions({ page: 1, size: 500 });
      setExhibitions(unwrapList(fetched).map(normalizeExhibition));
      setExhibitionForm({
        ...emptyExhibition,
        artistName: selectedArtist?.name || '',
        artistId: selectedArtist?.id || null,
        artistSlug: selectedArtist?.slug || null,
      });
      setSelectedExhibitionId(null);
    } catch (err) {
      console.error(err);
      setMessage('전시 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExhibitionEdit = (ex) => {
    setSelectedExhibitionId(ex.id);
    setExhibitionForm({
      ...normalizeExhibition(ex),
      artistName: selectedArtist?.name || ex.artistName || '',
      artistId: selectedArtist?.id || ex.artistId || null,
      artistSlug: selectedArtist?.slug || ex.artistSlug || null,
    });
  };

  const handleExhibitionDelete = async (ex) => {
    const id = ex?.id ?? ex?.Id ?? null;
    if (!id) {
      setMessage('전시 ID를 확인할 수 없습니다.');
      return;
    }
    if (!window.confirm('전시를 삭제하시겠습니까?')) return;
    try {
      setLoading(true);
      await deleteExhibition(id);
      setMessage('전시가 삭제되었습니다.');
      const fetched = await getExhibitions({ page: 1, size: 500 });
      setExhibitions(unwrapList(fetched).map(normalizeExhibition));
      setSelectedExhibitionId(null);
    } catch (err) {
      console.error(err);
      setMessage('전시 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExhibitionFileUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingExhibition(true);
      const res = await uploadArticleImage(file);
      const url = extractUploadUrl(res);
      setExhibitionForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error(err);
      setMessage('전시 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingExhibition(false);
    }
  };

  const handleResetArtist = () => {
    setSelectedArtistId(null);
    setArtistForm(emptyArtist);
    setArtworkForm(emptyArtwork);
    setExhibitionForm(emptyExhibition);
    setSelectedArtworkId(null);
    setSelectedExhibitionId(null);
  };
  const renderArtistList = () => (
    <div className="w-72 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">작가 목록</h2>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
          onClick={loadAll}
        >
          <FiRefreshCcw /> 새로고침
        </button>
      </div>
      <div className="rounded-lg border bg-white">
        {artists.map((artist) => (
          <button
            key={artist.id ?? artist.name}
            type="button"
            onClick={() => handleSelectArtist(artist)}
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
              selectedArtistId === artist.id ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
            }`}
          >
            <div>
              <div className="font-medium">{artist.name}</div>
              <div className="text-xs text-gray-500">{artist.nationality || ''}</div>
            </div>
            <FiEdit3 className="text-sm" />
          </button>
        ))}
      </div>
      <button
        type="button"
        className="flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm"
        onClick={() => {
          setCreatingArtistMode(true);
          setSelectedArtistId(null);
          setArtistForm(emptyArtist);
          setArtworkForm(emptyArtwork);
          setExhibitionForm(emptyExhibition);
        }}
      >
        <FiPlus /> 새 작가
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600"
        onClick={handleArtistDelete}
        disabled={!selectedArtistId}
      >
        <FiTrash2 /> 작가 삭제
      </button>
    </div>
  );

  const renderArtistForm = () => (
    <form onSubmit={handleArtistSubmit} className="flex flex-col gap-3 rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">작가 정보</h2>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={handleResetArtist}>
            초기화
          </button>
          <button type="submit" className="rounded-md bg-gray-900 px-3 py-1 text-xs text-white">
            저장
          </button>
        </div>
      </div>
      <label className="flex flex-col gap-1 text-xs">
        이름
        <input
          className="rounded border px-3 py-2 text-sm"
          value={artistForm.name}
          onChange={(e) => setArtistForm((p) => ({ ...p, name: e.target.value }))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        슬러그
        <input
          className="rounded border px-3 py-2 text-sm"
          value={artistForm.slug}
          onChange={(e) => setArtistForm((p) => ({ ...p, slug: e.target.value }))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        국적
        <select
          className="rounded border px-3 py-2 text-sm"
          value={artistForm.nationality}
          onChange={(e) => setArtistForm((p) => ({ ...p, nationality: e.target.value }))}
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        분야
        <input
          className="rounded border px-3 py-2 text-sm"
          placeholder="예: Painting, Media Art"
          value={artistForm.discipline}
          onChange={(e) => setArtistForm((p) => ({ ...p, discipline: e.target.value }))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        소개
        <textarea
          className="min-h-[140px] rounded border px-3 py-2 text-sm"
          value={artistForm.bio}
          onChange={(e) => setArtistForm((p) => ({ ...p, bio: e.target.value }))}
        />
      </label>
    </form>
  );
  const renderArtworkForm = () => (
    <form onSubmit={handleArtworkSubmit} className="flex flex-col gap-3 rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">작품 등록</h2>
          <p className="text-xs text-gray-500">{selectedArtist?.name ? `${selectedArtist.name} 작가 기준` : '작가를 선택해주세요'}</p>
        </div>
        <button type="submit" className="rounded-md bg-gray-900 px-3 py-1 text-xs text-white">
          {selectedArtworkId ? '수정' : '등록'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs">
          작품명
          <input
            className="rounded border px-3 py-2 text-sm"
            value={artworkForm.title}
            onChange={(e) => setArtworkForm((p) => ({ ...p, title: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          가격 (KRW)
          <input
            type="number"
            className="rounded border px-3 py-2 text-sm"
            value={artworkForm.price}
            onChange={(e) => setArtworkForm((p) => ({ ...p, price: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          상태
          <select
            className="rounded border px-3 py-2 text-sm"
            value={artworkForm.status}
            onChange={(e) => setArtworkForm((p) => ({ ...p, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          주제/테마
          <select
            className="rounded border px-3 py-2 text-sm"
            value={artworkForm.mainTheme}
            onChange={(e) => setArtworkForm((p) => ({ ...p, mainTheme: e.target.value }))}
          >
            <option value="">주제를 선택하세요</option>
            {THEME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          재료
          <select
            className="rounded border px-3 py-2 text-sm"
            value={artworkForm.material}
            onChange={(e) => setArtworkForm((p) => ({ ...p, material: e.target.value }))}
          >
            <option value="">재료 선택</option>
            {MATERIAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          호수 선택
          <select
            className="rounded border px-3 py-2 text-sm"
            value={artworkForm.sizeBucket}
            onChange={(e) => setArtworkForm((p) => ({ ...p, sizeBucket: e.target.value }))}
          >
            <option value="">호수를 선택하세요</option>
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          가로 (cm)
          <input
            type="number"
            className="rounded border px-3 py-2 text-sm"
            value={artworkForm.widthCm}
            onChange={(e) => setArtworkForm((p) => ({ ...p, widthCm: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          세로 (cm)
          <input
            type="number"
            className="rounded border px-3 py-2 text-sm"
            value={artworkForm.heightCm}
            onChange={(e) => setArtworkForm((p) => ({ ...p, heightCm: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs md:col-span-2">
          사이즈 텍스트 (표시용)
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="예: 130x97cm · 80호 이상"
            value={artworkForm.size}
            onChange={(e) => setArtworkForm((p) => ({ ...p, size: e.target.value }))}
          />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_auto]">
        <label className="flex flex-col gap-1 text-xs">
          이미지
          <div className="flex gap-2">
            <input
              className="flex-1 rounded border px-3 py-2 text-sm"
              placeholder="업로드 후 자동 입력"
              value={artworkForm.imageUrl}
              onChange={(e) => setArtworkForm((p) => ({ ...p, imageUrl: e.target.value }))}
            />
            <input
              ref={artworkFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleArtworkFileUpload(e.target.files?.[0])}
            />
            <button
              type="button"
              className="flex items-center gap-1 rounded-md border px-3 py-2 text-xs"
              onClick={() => artworkFileInputRef.current?.click()}
              disabled={uploadingArtwork}
            >
              <FiImage /> 파일 선택
            </button>
          </div>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={artworkForm.isRentable}
            onChange={(e) => setArtworkForm((p) => ({ ...p, isRentable: e.target.checked }))}
          />
          렌탈 가능
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs">
        렌탈 가격 (옵션)
        <input
          className="rounded border px-3 py-2 text-sm"
          placeholder="렌탈 가능 시 입력"
          value={artworkForm.rentPrice}
          onChange={(e) => setArtworkForm((p) => ({ ...p, rentPrice: e.target.value }))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        설명
        <textarea
          className="min-h-[140px] rounded border px-3 py-2 text-sm"
          value={artworkForm.description}
          onChange={(e) => setArtworkForm((p) => ({ ...p, description: e.target.value }))}
        />
      </label>
    </form>
  );
  const renderArtworkList = () => (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">등록된 작품</h3>
        <span className="text-xs text-gray-500">{filteredArtworks.length}개</span>
      </div>
      {filteredArtworks.length === 0 ? (
        <p className="py-4 text-sm text-gray-500">등록된 작품이 없습니다.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtworks.map((art) => (
            <div key={art.id} className="relative rounded-lg border bg-white p-3 shadow-sm">
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-white p-1 shadow"
                onClick={() => handleArtworkDelete(art)}
              >
                <FiTrash2 />
              </button>
              {art.imageUrl ? (
                <div className="mb-2 h-40 w-full overflow-hidden rounded-md bg-gray-50">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="mb-1 text-xs text-gray-500">{art.status}</div>
              <div className="text-sm font-semibold">{art.title}</div>
              <div className="text-xs text-gray-500">{art.price ? `${art.price.toLocaleString()}원` : ''}</div>
              <div className="mt-2 flex gap-2 text-xs text-gray-500">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md border px-2 py-1"
                  onClick={() => handleArtworkEdit(art)}
                >
                  <FiEdit3 /> 수정
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExhibitionForm = () => (
    <form onSubmit={handleExhibitionSubmit} className="flex flex-col gap-3 rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">전시 등록</h2>
          <p className="text-xs text-gray-500">{selectedArtist?.name ? `${selectedArtist.name} 작가 기준` : '작가를 선택해주세요'}</p>
        </div>
        <button type="submit" className="rounded-md bg-gray-900 px-3 py-1 text-xs text-white">
          {selectedExhibitionId ? '수정' : '등록'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs">
          전시명
          <input
            className="rounded border px-3 py-2 text-sm"
            value={exhibitionForm.title}
            onChange={(e) => setExhibitionForm((p) => ({ ...p, title: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          장소
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="전시장, 도시 등"
            value={exhibitionForm.location}
            onChange={(e) => setExhibitionForm((p) => ({ ...p, location: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          시작일
          <input
            type="date"
            className="rounded border px-3 py-2 text-sm"
            value={exhibitionForm.startDate}
            onChange={(e) => setExhibitionForm((p) => ({ ...p, startDate: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          종료일
          <input
            type="date"
            className="rounded border px-3 py-2 text-sm"
            value={exhibitionForm.endDate}
            onChange={(e) => setExhibitionForm((p) => ({ ...p, endDate: e.target.value }))}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs">
        이미지
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border px-3 py-2 text-sm"
            placeholder="업로드 후 자동 입력"
            value={exhibitionForm.imageUrl}
            onChange={(e) => setExhibitionForm((p) => ({ ...p, imageUrl: e.target.value }))}
          />
          <input
            ref={exhibitionFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleExhibitionFileUpload(e.target.files?.[0])}
          />
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border px-3 py-2 text-xs"
            onClick={() => exhibitionFileInputRef.current?.click()}
            disabled={uploadingExhibition}
          >
            <FiImage /> 파일 선택
          </button>
        </div>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        카테고리
        <select
          className="rounded border px-3 py-2 text-sm"
          value={exhibitionForm.category}
          onChange={(e) => setExhibitionForm((p) => ({ ...p, category: e.target.value }))}
        >
          <option value="">카테고리를 선택</option>
          {EXHIBITION_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        설명
        <textarea
          className="min-h-[140px] rounded border px-3 py-2 text-sm"
          value={exhibitionForm.description}
          onChange={(e) => setExhibitionForm((p) => ({ ...p, description: e.target.value }))}
        />
      </label>
    </form>
  );
  const renderExhibitionList = () => (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">등록된 전시</h3>
        <span className="text-xs text-gray-500">{filteredExhibitions.length}개</span>
      </div>
      {filteredExhibitions.length === 0 ? (
        <p className="py-4 text-sm text-gray-500">등록된 전시가 없습니다.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExhibitions.map((ex) => (
            <div key={ex.id} className="relative rounded-lg border bg-white p-3 shadow-sm">
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-white p-1 shadow"
                onClick={() => handleExhibitionDelete(ex)}
              >
                <FiTrash2 />
              </button>
              {ex.imageUrl ? (
                <div className="mb-2 h-32 w-full overflow-hidden rounded-md bg-gray-50">
                  <img src={ex.imageUrl} alt={ex.title} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="mb-1 text-xs text-gray-500">{ex.category || '-'}</div>
              <div className="text-sm font-semibold">{ex.title}</div>
              <div className="text-xs text-gray-500">{ex.location}</div>
              <div className="text-xs text-gray-500">
                {ex.startDate} ~ {ex.endDate}
              </div>
              <div className="mt-2 flex gap-2 text-xs text-gray-500">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md border px-2 py-1"
                  onClick={() => handleExhibitionEdit(ex)}
                >
                  <FiEdit3 /> 수정
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 bg-[#f8f4ec] p-4 text-gray-900">
      {message && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          {message}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {renderArtistList()}
        <div className="grid grid-cols-1 gap-4">
          {renderArtistForm()}
          {renderArtworkForm()}
          {renderArtworkList()}
          {renderExhibitionForm()}
          {renderExhibitionList()}
        </div>
      </div>
      {!isAdmin && <p className="text-sm text-red-500">관리자만 접근 가능합니다.</p>}
    </div>
  );
}

