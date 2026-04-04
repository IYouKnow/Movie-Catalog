import { AddMovieForm } from "@/components/add-movie-form";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AddPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Link
          href="/catalog"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to catalog
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Add a watched title
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Search the OMDb database, pick the correct match, rate it, and save. Details like plot, cast, and genres are stored from OMDb.
        </p>
      </div>
      <AddMovieForm />
    </div>
  );
}
