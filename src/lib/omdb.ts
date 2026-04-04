const OMDB_BASE = "https://www.omdbapi.com/";

export type OmdbSearchItem = {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
};

type OmdbSearchResponse = {
  Search?: OmdbSearchItem[];
  totalResults?: string;
  Response: string;
  Error?: string;
};

export type OmdbDetail = {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbID: string;
  Type: string;
  Response: string;
  Error?: string;
};

function getApiKey(): string {
  const key = process.env.OMDB_API_KEY;
  if (!key?.trim()) {
    throw new Error("OMDB_API_KEY is not configured");
  }
  return key.trim();
}

export async function searchOmdb(query: string): Promise<OmdbSearchItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(OMDB_BASE);
  url.searchParams.set("apikey", getApiKey());
  url.searchParams.set("s", q);

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

  return data.Search;
}

export async function getOmdbByImdbId(imdbId: string): Promise<OmdbDetail> {
  const id = imdbId.trim();
  if (!id) throw new Error("Missing IMDb ID");

  const url = new URL(OMDB_BASE);
  url.searchParams.set("apikey", getApiKey());
  url.searchParams.set("i", id);
  url.searchParams.set("plot", "full");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`OMDb request failed (${res.status})`);
  }

  const data = (await res.json()) as OmdbDetail;
  if (data.Response !== "True") {
    throw new Error(data.Error ?? "Title not found");
  }

  return data;
}
