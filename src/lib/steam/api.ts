// Steam Web API helpers
// Docs: https://developer.valvesoftware.com/wiki/Steam_Web_API
// All calls require STEAM_API_KEY set in .env

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const BASE_URL = "https://api.steampowered.com";

type SteamGame = { appid: number; name: string; playtime_forever?: number };

// Fetches the list of games owned by a Steam user (includes playtime).
// Returns { games, restricted: true } when the Steam library is private —
// Steam responds with an empty object rather than an error in that case.
export async function getOwnedGames(
  steamId64: string
): Promise<{ games: SteamGame[]; restricted: boolean }> {
  const url = `${BASE_URL}/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&include_appinfo=true&include_played_free_games=1&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  if (!data.response?.games) {
    return { games: [], restricted: true };
  }
  return { games: data.response.games, restricted: false };
}

// Fetches basic profile info (display name, avatar, etc.)
export async function getPlayerSummary(steamId64: string) {
  const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId64}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  return data.response.players[0] ?? null;
}

// Fetches achievements for a specific game (only earned ones with unlock timestamps)
export async function getPlayerAchievements(
  steamId64: string,
  appId: number
): Promise<{ apiname: string; achieved: number; unlocktime: number; name: string; description: string }[]> {
  const url = `${BASE_URL}/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&appid=${appId}&l=english`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  return data.playerstats?.achievements ?? [];
}
