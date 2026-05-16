import { NextRequest, NextResponse } from "next/server";

export type MusicResult = {
  id: string;
  name: string;
  artist: string;
  album: string;
  releaseId: string | null;
  imageUrl: string | null;
};

const MB_BASE = "https://musicbrainz.org/ws/2";
const UA = "Joourney/0.2.0 (contact@joourney.app)";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    const res = await fetch(
      `${MB_BASE}/recording?query=${encodeURIComponent(q)}&limit=6&fmt=json`,
      {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();

    // Construct Cover Art Archive URLs directly — no server-side fetch needed.
    // The browser follows the redirect; images that don't exist are handled
    // client-side with onError fallbacks.
    const recordings: MusicResult[] = (data.recordings ?? []).map(
      (r: Record<string, unknown>) => {
        const credits = r["artist-credit"] as { artist: { name: string } }[] | undefined;
        const releases = r.releases as { id: string; title: string }[] | undefined;
        const release = releases?.[0];
        return {
          id: r.id as string,
          name: r.title as string,
          artist: credits?.[0]?.artist?.name ?? "Unknown artist",
          album: release?.title ?? "",
          releaseId: release?.id ?? null,
          imageUrl: release?.id
            ? `https://coverartarchive.org/release/${release.id}/front-250`
            : null,
        };
      }
    );

    return NextResponse.json(recordings);
  } catch {
    return NextResponse.json([]);
  }
}
