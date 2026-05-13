// GET /api/igdb/search?q=... — proxies IGDB through the server so the
// Twitch client secret never touches the browser.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { searchIGDB } from "@/lib/igdb";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  try {
    const results = await searchIGDB(q);
    return NextResponse.json(results);
  } catch (err) {
    // Log to terminal so the dev can see what's failing
    console.error("[IGDB search]", err instanceof Error ? err.message : err);
    return NextResponse.json([]);
  }
}
