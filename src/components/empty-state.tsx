"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ImportModal } from "@/components/import-modal";

export function EmptyState() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <>
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <p className="text-zinc-700 dark:text-zinc-300">Nothing here yet.</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Search OMDb and save something you have finished watching, or import
          from a file.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/add"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add your first title
          </Link>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Import from file
          </button>
        </div>
      </div>
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => startTransition(() => window.location.reload())}
      />
    </>
  );
}
