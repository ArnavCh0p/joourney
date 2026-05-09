// Steam Web API helpers
// Docs: https://developer.valvesoftware.com/wiki/Steam_Web_API
// All calls require STEAM_API_KEY set in .env

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const BASE_URL = "https://api.steampowered.com";

// Fetches the list of games owned by a Steam user (includes playtime)
// steamId64: the user's 64-bit Steam ID (returned by the OpenID login flow)
export async function getOwnedGames(steamId64: string) {
  const url = `${BASE_URL}/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&include_appinfo=true&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  return data.response.games ?? [];
}

// Fetches basic profile info (display name, avatar, etc.)
export async function getPlayerSummary(steamId64: string) {
  const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId64}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  return data.response.players[0] ?? null;
}

// Fetches achievements for a specific game
export async function getPlayerAchievements(steamId64: string, appId: number) {
  const url = `${BASE_URL}/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId64}&appid=${appId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  const data = await res.json();
  return data.playerstats?.achievements ?? [];
}
