import { deleteWatchEntryForm, updateWatchRating } from "@/lib/watch-actions";
import type { WatchEntryModel as WatchEntry } from "@/generated/prisma/models/WatchEntry";
import Image from "next/image";

type WatchEntryCardProps = {
  entry: WatchEntry;
};

export function WatchEntryCard({ entry }: WatchEntryCardProps) {
  const hasPoster = Boolean(entry.posterUrl);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row">
      <div className="relative aspect-[2/3] w-full shrink-0 bg-zinc-100 sm:w-40 dark:bg-zinc-900">
        {hasPoster && entry.posterUrl ? (
          <Image
            src={entry.posterUrl}
            alt={`Poster for ${entry.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 160px"
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-sm text-zinc-500">
            No poster
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{entry.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {[entry.year, entry.type, entry.rated].filter(Boolean).join(" · ")}
          </p>
        </div>
        {entry.genre ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Genres: </span>
            {entry.genre}
          </p>
        ) : null}
        {entry.director ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Director: </span>
            {entry.director}
          </p>
        ) : null}
        {entry.actors ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Cast: </span>
            {entry.actors}
          </p>
        ) : null}
        {entry.plot ? (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{entry.plot}</p>
        ) : null}
        <div className="mt-auto flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
          <form action={updateWatchRating} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="entryId" value={entry.id} />
            <label htmlFor={`rating-${entry.id}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Your rating
            </label>
            <select
              id={`rating-${entry.id}`}
              name="userRating"
              defaultValue={entry.userRating}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Update
            </button>
          </form>
          <form action={deleteWatchEntryForm}>
            <input type="hidden" name="entryId" value={entry.id} />
            <button
              type="submit"
              className="text-sm font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400"
            >
              Remove from catalog
            </button>
          </form>
        </div>
        <p className="text-xs text-zinc-400">
          Watched {new Date(entry.watchedAt).toLocaleDateString()} · {entry.imdbId}
        </p>
      </div>
    </article>
  );
}
