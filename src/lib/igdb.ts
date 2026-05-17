// IGDB game search — IGDB uses Twitch OAuth for auth.
// Required env vars (add to .env.local):
//   TWITCH_CLIENT_ID     — from dev.twitch.tv app registration
//   TWITCH_CLIENT_SECRET — same app, keep server-side only

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_GAMES_URL   = "https://api.igdb.com/v4/games";

// Module-level token cache — resets on server restart, which is fine
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }
  const res = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type:    "client_credentials",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Twitch token fetch failed: ${res.status} — ${body}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error("Twitch token response missing access_token");
  cachedToken = {
    value:     data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

// Map IGDB platform names to Joourney's platform enum values.
// PC is checked across all platforms first — a game available on PC + console
// should show "PC" since this is a PC gaming journal.
function mapPlatform(platforms: { name: string }[]): string {
  const names = platforms.map((p) => p.name.toLowerCase());
  if (names.some((n) => n.includes("pc") || n.includes("windows") || n.includes("mac") || n.includes("linux"))) return "PC";
  if (names.some((n) => n.includes("playstation")))                                            return "PlayStation";
  if (names.some((n) => n.includes("xbox")))                                                   return "Xbox";
  if (names.some((n) => n.includes("nintendo") || n.includes("switch") || n.includes("wii"))) return "Nintendo";
  return "Other";
}

export type IGDBResult = {
  igdbId:   number;
  name:     string;
  coverUrl: string | null;
  platform: string;
};

export async function searchIGDB(query: string, limit = 8): Promise<IGDBResult[]> {
  const token = await getAccessToken();
  // Strip quotes to prevent IGDB query injection
  const safe = query.replace(/"/g, "").slice(0, 100);
  // Filter out DLC (1), expansions (2), and bundles (3) — they clutter results.
  // Also allow category = null: IGDB leaves the field unpopulated on many entries,
  // and a bare `category != 1` filter silently drops those games entirely.
  // Request `follows` so we can sort by popularity locally — IGDB's `search`
  // keyword ignores server-side `sort`.
  const body = `fields name,cover.url,platforms.name,follows; search "${safe}"; where category = null | (category != 1 & category != 2 & category != 3); limit ${limit};`;

  const res = await fetch(IGDB_GAMES_URL, {
    method: "POST",
    headers: {
      "Client-ID":     process.env.TWITCH_CLIENT_ID!,
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "text/plain",
    },
    body,
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`IGDB search failed: ${res.status} — ${errBody}`);
  }
  const games = await res.json() as Array<{
    id: number;
    name: string;
    cover?: { url: string };
    platforms?: { name: string }[];
    follows?: number;
  }>;
  // Sort by follow count so canonical/popular games (e.g. Valorant, Fortnite)
  // surface first — IGDB text-relevance alone buries them behind spin-offs.
  return games
    .sort((a, b) => (b.follows ?? 0) - (a.follows ?? 0))
    .map((g) => ({
      igdbId:   g.id,
      name:     g.name,
      // IGDB returns protocol-relative URLs (//images.igdb.com/...); use t_cover_big (264×374)
      coverUrl: g.cover?.url
        ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      platform: g.platforms ? mapPlatform(g.platforms) : "Other",
    }));
}
