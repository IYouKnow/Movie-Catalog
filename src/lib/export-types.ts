export type ExportColumn = {
  key: string;
  label: string;
};

export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "year", label: "Year" },
  { key: "userRating", label: "Your Rating" },
  { key: "watchedAt", label: "Watched Date" },
  { key: "genre", label: "Genre" },
  { key: "director", label: "Director" },
  { key: "actors", label: "Actors" },
  { key: "plot", label: "Plot" },
  { key: "runtime", label: "Runtime" },
  { key: "rated", label: "Rated" },
  { key: "imdbId", label: "IMDb ID" },
];

export type ExportFormat = "csv" | "json";
