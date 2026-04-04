"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOmdbByImdbId } from "@/lib/omdb";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function emptyToNull(v: string | undefined | null): string | null {
  if (v == null || v === "" || v === "N/A") return null;
  return v;
}

const addSchema = z.object({
  imdbId: z.string().min(2),
  userRating: z.coerce.number().int().min(1).max(10),
});

export type AddWatchState = { error?: string; ok?: boolean };

export async function addWatchEntry(
  _prev: AddWatchState | undefined,
  formData: FormData,
): Promise<AddWatchState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You need to be signed in." };
  }

  const parsed = addSchema.safeParse({
    imdbId: formData.get("imdbId"),
    userRating: formData.get("userRating"),
  });

  if (!parsed.success) {
    return { error: "Choose a title and a rating from 1 to 10." };
  }

  let detail;
  try {
    detail = await getOmdbByImdbId(parsed.data.imdbId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not load title details.",
    };
  }

  const posterUrl =
    detail.Poster && detail.Poster !== "N/A" ? detail.Poster : null;

  try {
    await prisma.watchEntry.create({
      data: {
        userId: session.user.id,
        imdbId: detail.imdbID,
        userRating: parsed.data.userRating,
        title: detail.Title,
        type: detail.Type,
        year: emptyToNull(detail.Year),
        runtime: emptyToNull(detail.Runtime),
        genre: emptyToNull(detail.Genre),
        director: emptyToNull(detail.Director),
        actors: emptyToNull(detail.Actors),
        plot: emptyToNull(detail.Plot),
        posterUrl,
        rated: emptyToNull(detail.Rated),
      },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? e.code : null;
    if (code === "P2002") {
      return { error: "This title is already in your catalog." };
    }
    throw e;
  }

  revalidatePath("/catalog");
  return { ok: true };
}

export async function updateWatchRating(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const entryId = String(formData.get("entryId") ?? "");
  const userRating = Number(formData.get("userRating"));
  if (!entryId || !Number.isInteger(userRating) || userRating < 1 || userRating > 10) {
    return;
  }

  await prisma.watchEntry.updateMany({
    where: { id: entryId, userId: session.user.id },
    data: { userRating },
  });

  revalidatePath("/catalog");
}

export async function deleteWatchEntry(entryId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.watchEntry.deleteMany({
    where: { id: entryId, userId: session.user.id },
  });

  revalidatePath("/catalog");
}

export async function deleteWatchEntryForm(formData: FormData): Promise<void> {
  const entryId = String(formData.get("entryId") ?? "");
  if (!entryId) return;
  await deleteWatchEntry(entryId);
}
