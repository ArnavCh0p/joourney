import { NextRequest, NextResponse } from "next/server";

export type MusicResult = {
  id: string;
  name: string;
  artist: string;
  album: string;
  releaseId: string | null;
  imageUrl: string | null;
  type: "track" | "album";
};

const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org/release";
const UA = "Joourney/0.2.0 (contact@joourney.app)";

async function fetchCoverArt(releaseId: string): Promise<string | null> {
  try {
    const res = await fetch(`${CAA_BASE}/${releaseId}/front`, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    // The redirect lands on the actual image URL — return the final URL
    return res.url;
  } catch {
    return null;
  }
}

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
    const recordings: MusicResult[] = [];

    for (const r of data.recordings ?? []) {
      const artist = r["artist-credit"]?.[0]?.artist?.name ?? "Unknown artist";
      // Prefer the first release that has a release group
      const release = r.releases?.[0];
      const album = release?.title ?? "";
      const releaseId: string | null = release?.id ?? null;

      const imageUrl = releaseId ? await fetchCoverArt(releaseId) : null;

      recordings.push({
        id: r.id,
        name: r.title,
        artist,
        album,
        releaseId,
        imageUrl,
        type: "track",
      });
    }

    return NextResponse.json(recordings);
  } catch {
    return NextResponse.json([]);
  }
}
