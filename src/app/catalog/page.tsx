import { CatalogView } from "@/components/catalog-view";
import { EmptyState } from "@/components/empty-state";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CatalogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const entries = await prisma.watchEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Your catalog
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Movies and series you have marked as watched.
          </p>
        </div>
        <Link
          href="/add"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add watched title
        </Link>
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <CatalogView entries={entries} />
      )}
    </div>
  );
}
