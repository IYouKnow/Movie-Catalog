import { auth } from "@/auth";
import { getFeaturedTitles, searchTitles } from "@/lib/titles";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  try {
    if (q.trim().length < 2) {
      const results = await getFeaturedTitles();
      return NextResponse.json({ results });
    }
    const results = await searchTitles(q);
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
