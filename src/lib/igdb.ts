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

// Map IGDB platform names to Joourney's platform enum values
function mapPlatform(platforms: { name: string }[]): string {
  for (const { name } of platforms) {
    const n = name.toLowerCase();
    if (n.includes("playstation"))                                            return "PlayStation";
    if (n.includes("xbox"))                                                   return "Xbox";
    if (n.includes("nintendo") || n.includes("switch") || n.includes("wii")) return "Nintendo";
    if (n.includes("pc") || n.includes("windows") || n.includes("mac") || n.includes("linux")) return "PC";
  }
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
  // No where clause — the category field is often unpopulated in IGDB, so any
  // category or version_parent filter silently drops most results.
  const body = `fields name,cover.url,platforms.name; search "${safe}"; limit ${limit};`;

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
  }>;
  return games.map((g) => ({
    igdbId:   g.id,
    name:     g.name,
    // IGDB returns protocol-relative URLs (//images.igdb.com/...); use t_cover_big (264×374)
    coverUrl: g.cover?.url
      ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
      : null,
    platform: g.platforms ? mapPlatform(g.platforms) : "Other",
  }));
}
