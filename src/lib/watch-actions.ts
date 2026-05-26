"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTitleDetail } from "@/lib/titles";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function emptyToNull(v: string | undefined | null): string | null {
  if (v == null || v === "" || v === "N/A") return null;
  return v;
}

const addSchema = z.object({
  imdbId: z.string().optional().default(""),
  source: z.enum(["omdb", "tmdb"]),
  sourceId: z.string().min(1),
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
    source: formData.get("source"),
    sourceId: formData.get("sourceId"),
    userRating: formData.get("userRating"),
  });

  if (!parsed.success) {
    return { error: "Choose a title and a rating from 1 to 10." };
  }

  let detail;
  try {
    detail = await getTitleDetail(
      parsed.data.source,
      parsed.data.sourceId,
      parsed.data.imdbId,
    );
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not load title details.",
    };
  }

  try {
    await prisma.watchEntry.create({
      data: {
        userId: session.user.id,
        imdbId: detail.imdbId,
        userRating: parsed.data.userRating,
        title: detail.title,
        type: detail.type,
        year: emptyToNull(detail.year),
        runtime: emptyToNull(detail.runtime),
        genre: emptyToNull(detail.genre),
        director: emptyToNull(detail.director),
        actors: emptyToNull(detail.actors),
        plot: emptyToNull(detail.plot),
        posterUrl: emptyToNull(detail.posterUrl),
        rated: emptyToNull(detail.rated),
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
