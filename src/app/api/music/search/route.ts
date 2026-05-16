import { NextRequest, NextResponse } from "next/server";

export type MusicResult = {
  id: string;
  name: string;
  artist: string;
  album: string;
  releaseId: string | null;
  imageUrl: string | null;
};

type ItunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=6`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();

    const recordings: MusicResult[] = (data.results ?? []).map(
      (r: ItunesTrack) => ({
        id: String(r.trackId),
        name: r.trackName,
        artist: r.artistName,
        album: r.collectionName ?? "",
        releaseId: null,
        // Upscale the artwork from 100px to 300px by replacing the size token
        imageUrl: r.artworkUrl100?.replace("100x100bb", "300x300bb") ?? null,
      })
    );

    return NextResponse.json(recordings);
  } catch {
    return NextResponse.json([]);
  }
}
