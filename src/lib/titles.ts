const OMDB_BASE = "https://www.omdbapi.com/";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export type CatalogTitleType = "movie" | "series";
export type TitleProvider = "omdb" | "tmdb";

export type CatalogSearchItem = {
  title: string;
  year: string;
  imdbId: string | null;
  type: CatalogTitleType;
  posterUrl: string | null;
  source: TitleProvider;
  sourceId: string;
};

export type CatalogTitleDetail = {
  title: string;
  year: string | null;
  rated: string | null;
  runtime: string | null;
  genre: string | null;
  director: string | null;
  actors: string | null;
  plot: string | null;
  posterUrl: string | null;
  imdbId: string;
  type: CatalogTitleType;
};

type OmdbSearchItem = {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
};

type OmdbSearchResponse = {
  Search?: OmdbSearchItem[];
  Response: string;
  Error?: string;
};

type OmdbDetail = {
  Title: string;
  Year: string;
  Rated: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbID: string;
  Type: string;
  Response: string;
  Error?: string;
};

type TmdbSearchMovieItem = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
};

type TmdbSearchTvItem = {
  id: number;
  name: string;
  first_air_date?: string;
  poster_path?: string | null;
};

type TmdbSearchResponse<T> = {
  results?: T[];
};

type TmdbMovieDetail = {
  title: string;
  release_date?: string;
  runtime?: number | null;
  genres?: Array<{ name: string }>;
  overview?: string;
  poster_path?: string | null;
  credits?: {
    cast?: Array<{ name: string }>;
    crew?: Array<{ name: string; job?: string }>;
  };
  release_dates?: {
    results?: Array<{
      iso_3166_1: string;
      release_dates?: Array<{ certification?: string }>;
    }>;
  };
  external_ids?: {
    imdb_id?: string | null;
  };
};

type TmdbTvDetail = {
  name: string;
  first_air_date?: string;
  episode_run_time?: number[];
  genres?: Array<{ name: string }>;
  overview?: string;
  poster_path?: string | null;
  credits?: {
    cast?: Array<{ name: string }>;
    crew?: Array<{ name: string; job?: string }>;
  };
  content_ratings?: {
    results?: Array<{ iso_3166_1: string; rating?: string }>;
  };
  external_ids?: {
    imdb_id?: string | null;
  };
  created_by?: Array<{ name: string }>;
};

type TmdbTrendingMovieItem = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
};

type TmdbTrendingTvItem = {
  id: number;
  name: string;
  first_air_date?: string;
  poster_path?: string | null;
};

function emptyToNull(value: string | null | undefined): string | null {
  if (!value || value === "N/A") return null;
  return value;
}

function getOmdbApiKey(): string {
  const key = process.env.OMDB_API_KEY;
  if (!key?.trim()) {
    throw new Error("OMDB_API_KEY is not configured");
  }
  return key.trim();
}

function getTmdbReadToken(): string | null {
  const token = process.env.TMDB_API_READ_TOKEN?.trim();
  return token || null;
}

function getTmdbApiKey(): string | null {
  const key = process.env.TMDB_API_KEY?.trim();
  return key || null;
}

function isLikelyTmdbReadToken(value: string): boolean {
  return value.split(".").length === 3;
}

function normalizeTitleType(value: string | undefined): CatalogTitleType {
  return value === "series" || value === "tv" ? "series" : "movie";
}

function yearFromDate(value: string | undefined): string {
  if (!value) return "";
  return value.slice(0, 4);
}

function posterFromTmdb(path: string | null | undefined): string | null {
  return path ? `${TMDB_IMAGE_BASE}${path}` : null;
}

function runtimeMinutes(value: number | null | undefined): string | null {
  if (!value || value <= 0) return null;
  return `${value} min`;
}

function asCommaList(values: Array<{ name: string }> | undefined, limit = 5): string | null {
  if (!values?.length) return null;
  return values.slice(0, limit).map((value) => value.name).join(", ");
}

function pickCrewNames(
  crew: Array<{ name: string; job?: string }> | undefined,
  wantedJobs: string[],
): string | null {
  if (!crew?.length) return null;
  const names = crew
    .filter((item) => item.job && wantedJobs.includes(item.job))
    .map((item) => item.name);
  return names.length ? Array.from(new Set(names)).join(", ") : null;
}

function pickMovieRating(data: TmdbMovieDetail): string | null {
  const us = data.release_dates?.results?.find((item) => item.iso_3166_1 === "US");
  return emptyToNull(us?.release_dates?.find((item) => item.certification)?.certification);
}

function pickTvRating(data: TmdbTvDetail): string | null {
  const us = data.content_ratings?.results?.find((item) => item.iso_3166_1 === "US");
  return emptyToNull(us?.rating);
}

function dedupeBySource(items: CatalogSearchItem[]): CatalogSearchItem[] {
  const seen = new Set<string>();
  const out: CatalogSearchItem[] = [];
  for (const item of items) {
    const key = `${item.source}:${item.sourceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function dedupeMergedResults(items: CatalogSearchItem[]): CatalogSearchItem[] {
  const seen = new Set<string>();
  const out: CatalogSearchItem[] = [];

  for (const item of items) {
    const key = item.imdbId
      ? `imdb:${item.imdbId}`
      : `${item.type}:${normalizeSearchText(item.title)}:${item.year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function scoreSearchItem(item: CatalogSearchItem, query: string): number {
  const q = normalizeSearchText(query);
  const title = normalizeSearchText(item.title);
  if (title === q) return 400;
  if (title.startsWith(`${q} `) || title.endsWith(` ${q}`)) return 250;
  if (title.startsWith(q)) return 200;
  if (title.includes(q)) return 120;
  return 0;
}

function sortSearchResults(items: CatalogSearchItem[], query: string): CatalogSearchItem[] {
  return [...items].sort((a, b) => {
    const scoreDiff = scoreSearchItem(b, query) - scoreSearchItem(a, query);
    if (scoreDiff !== 0) return scoreDiff;
    if (a.source !== b.source) return a.source === "omdb" ? -1 : 1;
    const yearA = Number.parseInt(a.year, 10) || 0;
    const yearB = Number.parseInt(b.year, 10) || 0;
    return yearB - yearA;
  });
}

async function fetchTmdb<T>(path: string, searchParams?: Record<string, string>): Promise<T> {
  const token = getTmdbReadToken();
  const apiKey = getTmdbApiKey();
  const legacyApiKey = token && !isLikelyTmdbReadToken(token) ? token : null;
  const finalApiKey = apiKey || legacyApiKey;

  if (!token && !finalApiKey) {
    throw new Error("TMDB_API_READ_TOKEN or TMDB_API_KEY is not configured");
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  if (finalApiKey) {
    url.searchParams.set("api_key", finalApiKey);
  }

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: token && isLikelyTmdbReadToken(token)
      ? {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        }
      : {
          Accept: "application/json",
        },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status})`);
  }

  return (await res.json()) as T;
}

async function searchOmdb(query: string): Promise<CatalogSearchItem[]> {
  const url = new URL(OMDB_BASE);
  url.searchParams.set("apikey", getOmdbApiKey());
  url.searchParams.set("s", query);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`OMDb request failed (${res.status})`);
  }

  const data = (await res.json()) as OmdbSearchResponse;
  if (data.Response !== "True" || !data.Search) {
    if (data.Error?.toLowerCase().includes("not found")) return [];
    if (data.Error) throw new Error(data.Error);
    return [];
  }

  return data.Search.map((item) => ({
    title: item.Title,
    year: item.Year,
    imdbId: item.imdbID,
    type: normalizeTitleType(item.Type),
    posterUrl: emptyToNull(item.Poster),
    source: "omdb",
    sourceId: item.imdbID,
  }));
}

async function searchTmdb(query: string): Promise<CatalogSearchItem[]> {
  const pages = [1, 2, 3];
  const [moviePages, tvPages] = await Promise.all([
    Promise.all(
      pages.map((page) =>
        fetchTmdb<TmdbSearchResponse<TmdbSearchMovieItem>>("/search/movie", {
          query,
          include_adult: "false",
          page: String(page),
        }),
      ),
    ),
    Promise.all(
      pages.map((page) =>
        fetchTmdb<TmdbSearchResponse<TmdbSearchTvItem>>("/search/tv", {
          query,
          include_adult: "false",
          page: String(page),
        }),
      ),
    ),
  ]);

  const movieItems = moviePages.flatMap((page) =>
    (page.results ?? []).map((item) => ({
      title: item.title,
      year: yearFromDate(item.release_date),
      imdbId: null,
      type: "movie" as const,
      posterUrl: posterFromTmdb(item.poster_path),
      source: "tmdb" as const,
      sourceId: `movie:${item.id}`,
    })),
  );

  const tvItems = tvPages.flatMap((page) =>
    (page.results ?? []).map((item) => ({
      title: item.name,
      year: yearFromDate(item.first_air_date),
      imdbId: null,
      type: "series" as const,
      posterUrl: posterFromTmdb(item.poster_path),
      source: "tmdb" as const,
      sourceId: `tv:${item.id}`,
    })),
  );

  return sortSearchResults([...movieItems, ...tvItems], query);
}

async function getOmdbByImdbId(imdbId: string): Promise<CatalogTitleDetail> {
  const url = new URL(OMDB_BASE);
  url.searchParams.set("apikey", getOmdbApiKey());
  url.searchParams.set("i", imdbId);
  url.searchParams.set("plot", "full");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`OMDb request failed (${res.status})`);
  }

  const data = (await res.json()) as OmdbDetail;
  if (data.Response !== "True") {
    throw new Error(data.Error ?? "Title not found");
  }

  return {
    title: data.Title,
    year: emptyToNull(data.Year),
    rated: emptyToNull(data.Rated),
    runtime: emptyToNull(data.Runtime),
    genre: emptyToNull(data.Genre),
    director: emptyToNull(data.Director),
    actors: emptyToNull(data.Actors),
    plot: emptyToNull(data.Plot),
    posterUrl: emptyToNull(data.Poster),
    imdbId: data.imdbID,
    type: normalizeTitleType(data.Type),
  };
}

async function getTmdbDetail(sourceId: string): Promise<CatalogTitleDetail> {
  const [kind, rawId] = sourceId.split(":");
  const id = Number(rawId);
  if (!kind || !Number.isInteger(id)) {
    throw new Error("Invalid TMDB source ID");
  }

  if (kind === "movie") {
    const data = await fetchTmdb<TmdbMovieDetail>(`/movie/${id}`, {
      append_to_response: "credits,release_dates,external_ids",
    });
    const imdbId = data.external_ids?.imdb_id?.trim();
    if (!imdbId) throw new Error("TMDB title is missing an IMDb ID");
    return {
      title: data.title,
      year: emptyToNull(yearFromDate(data.release_date)),
      rated: pickMovieRating(data),
      runtime: runtimeMinutes(data.runtime),
      genre: asCommaList(data.genres),
      director: pickCrewNames(data.credits?.crew, ["Director"]),
      actors: asCommaList(data.credits?.cast, 5),
      plot: emptyToNull(data.overview),
      posterUrl: posterFromTmdb(data.poster_path),
      imdbId,
      type: "movie",
    };
  }

  if (kind === "tv") {
    const data = await fetchTmdb<TmdbTvDetail>(`/tv/${id}`, {
      append_to_response: "credits,content_ratings,external_ids",
    });
    const imdbId = data.external_ids?.imdb_id?.trim();
    if (!imdbId) throw new Error("TMDB title is missing an IMDb ID");
    return {
      title: data.name,
      year: emptyToNull(yearFromDate(data.first_air_date)),
      rated: pickTvRating(data),
      runtime: runtimeMinutes(data.episode_run_time?.[0]),
      genre: asCommaList(data.genres),
      director:
        pickCrewNames(data.credits?.crew, ["Director"]) ||
        asCommaList(data.created_by, 3),
      actors: asCommaList(data.credits?.cast, 5),
      plot: emptyToNull(data.overview),
      posterUrl: posterFromTmdb(data.poster_path),
      imdbId,
      type: "series",
    };
  }

  throw new Error("Unsupported TMDB title type");
}

export async function searchTitles(query: string): Promise<CatalogSearchItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const tmdbEnabled = Boolean(getTmdbReadToken());
  const [omdbResult, tmdbResult] = await Promise.allSettled([
    searchOmdb(q),
    tmdbEnabled ? searchTmdb(q) : Promise.resolve([] as CatalogSearchItem[]),
  ]);

  const omdbResults =
    omdbResult.status === "fulfilled" ? dedupeBySource(omdbResult.value) : [];
  const tmdbResults =
    tmdbResult.status === "fulfilled" ? dedupeBySource(tmdbResult.value) : [];

  if (omdbResults.length === 0 && tmdbResults.length === 0) {
    if (omdbResult.status === "rejected") {
      throw omdbResult.reason;
    }
    if (tmdbEnabled && tmdbResult.status === "rejected") {
      throw tmdbResult.reason;
    }
    return [];
  }

  return sortSearchResults(
    dedupeMergedResults([...omdbResults, ...tmdbResults]),
    q,
  );
}

export async function getFeaturedTitles(): Promise<CatalogSearchItem[]> {
  if (!getTmdbReadToken() && !getTmdbApiKey()) {
    return [];
  }

  const [movies, tv] = await Promise.all([
    fetchTmdb<TmdbSearchResponse<TmdbTrendingMovieItem>>("/trending/movie/day"),
    fetchTmdb<TmdbSearchResponse<TmdbTrendingTvItem>>("/trending/tv/day"),
  ]);

  const items: CatalogSearchItem[] = [
    ...(movies.results ?? []).slice(0, 8).map((item) => ({
      title: item.title,
      year: yearFromDate(item.release_date),
      imdbId: null,
      type: "movie" as const,
      posterUrl: posterFromTmdb(item.poster_path),
      source: "tmdb" as const,
      sourceId: `movie:${item.id}`,
    })),
    ...(tv.results ?? []).slice(0, 8).map((item) => ({
      title: item.name,
      year: yearFromDate(item.first_air_date),
      imdbId: null,
      type: "series" as const,
      posterUrl: posterFromTmdb(item.poster_path),
      source: "tmdb" as const,
      sourceId: `tv:${item.id}`,
    })),
  ];

  return dedupeMergedResults(items);
}

export async function getTitleDetail(
  source: TitleProvider,
  sourceId: string,
  imdbId?: string | null,
): Promise<CatalogTitleDetail> {
  if (source === "omdb") {
    const finalImdbId = (imdbId || sourceId).trim();
    if (!finalImdbId) throw new Error("Missing IMDb ID");
    return getOmdbByImdbId(finalImdbId);
  }

  const tmdbDetail = await getTmdbDetail(sourceId);

  try {
    return await getOmdbByImdbId(tmdbDetail.imdbId);
  } catch {
    return tmdbDetail;
  }
}
