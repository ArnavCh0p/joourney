import { NextRequest, NextResponse } from "next/server";

export type MusicResult = {
  id: string;
  name: string;
  artist: string;
  album: string;
  releaseId: string | null;
  imageUrl: string | null;
};

type MBRelease = {
  id: string;
  title: string;
  status?: string;
};

type MBRecording = {
  id: string;
  title: string;
  score: number;
  "artist-credit"?: { artist: { name: string } }[];
  releases?: MBRelease[];
};

const MB_BASE = "https://musicbrainz.org/ws/2";
const UA = "Joourney/0.2.0 (contact@joourney.app)";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    // Fetch more candidates than we need so re-ranking has room to work
    const res = await fetch(
      `${MB_BASE}/recording?query=${encodeURIComponent(q)}&limit=25&fmt=json`,
      {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const raw: MBRecording[] = data.recordings ?? [];

    // Re-rank: recordings with more official releases are the well-known versions.
    // Blend with MB's own text-match score so a perfect title match still rises.
    const ranked = raw
      .map((r) => {
        const officialCount = (r.releases ?? []).filter(
          (rel) => rel.status === "Official"
        ).length;
        // Weighted score: release count matters more than text match position
        const score = officialCount * 10 + (r.score ?? 0) * 0.1;
        return { r, score, officialCount };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const recordings: MusicResult[] = ranked.map(({ r }) => {
      const artist = r["artist-credit"]?.[0]?.artist?.name ?? "Unknown artist";
      // Prefer an official release for the album name and cover art
      const official = r.releases?.find((rel) => rel.status === "Official");
      const release = official ?? r.releases?.[0];
      return {
        id: r.id,
        name: r.title,
        artist,
        album: release?.title ?? "",
        releaseId: release?.id ?? null,
        imageUrl: release?.id
          ? `https://coverartarchive.org/release/${release.id}/front-250`
          : null,
      };
    });

    return NextResponse.json(recordings);
  } catch {
    return NextResponse.json([]);
  }
}
