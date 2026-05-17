import { ExternalLink } from "@/components/ExternalLink";

type PlayingGame = { id: string; steamAppId: number | null; name: string };

type NewsItem = {
  gid: string;
  title: string;
  url: string;
  date: number;
  feedname: string;
};

const CUTOFF_DAYS = 45;

async function fetchGameNews(appId: number): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=5&maxlength=1&format=json`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const cutoff = (Date.now() / 1000) - CUTOFF_DAYS * 86400;
    return ((data?.appnews?.newsitems ?? []) as NewsItem[])
      .filter((item) => item.date >= cutoff)
      .slice(0, 2);
  } catch {
    return [];
  }
}

function timeAgo(unix: number): string {
  const diffMs  = Date.now() - unix * 1000;
  const hours   = Math.floor(diffMs / (1000 * 60 * 60));
  const days    = Math.floor(hours / 24);
  if (hours < 1)  return "just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default async function LibraryNews({ games }: { games: PlayingGame[] }) {
  const results = await Promise.all(
    games.slice(0, 5).filter((g) => g.steamAppId != null).map(async (game) => ({
      game,
      items: await fetchGameNews(game.steamAppId!),
    }))
  );

  // Flatten, sort newest first, cap at 6 items total
  const flat = results
    .flatMap(({ game, items }) => items.map((item) => ({ game, item })))
    .sort((a, b) => b.item.date - a.item.date)
    .slice(0, 6);

  if (flat.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Updates for your library
      </h2>
      <div className="space-y-2">
        {flat.map(({ game, item }) => (
          <ExternalLink
            key={item.gid}
            href={item.url}
            className="w-full flex items-start gap-4 rounded-xl border border-slate-700/50 bg-slate-900 px-4 py-3.5 hover:bg-slate-800/70 transition-colors group text-left"
          >
            <img
              src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/capsule_sm_120.jpg`}
              alt={game.name}
              className="h-12 w-20 rounded object-cover flex-shrink-0 bg-slate-800 mt-0.5"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                const fb = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`;
                if (img.src !== fb) { img.src = fb; } else { img.style.display = "none"; }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 line-clamp-2 group-hover:text-white transition-colors leading-snug">
                {item.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-slate-400">{game.name}</span>
                <span className="text-xs text-slate-700">·</span>
                <span className="text-xs text-slate-500">{timeAgo(item.date)}</span>
              </div>
            </div>
            <span className="text-slate-600 flex-shrink-0 group-hover:text-slate-300 transition-colors mt-0.5">↗</span>
          </ExternalLink>
        ))}
      </div>
    </section>
  );
}
