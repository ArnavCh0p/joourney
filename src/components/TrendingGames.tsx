import TrendingCarousel, { type TrendingGame } from "./TrendingCarousel";

type ApiItem = {
  id: number;
  name: string;
  small_capsule_image: string;
};

async function fetchTopSellers(): Promise<ApiItem[]> {
  try {
    const res = await fetch(
      "https://store.steampowered.com/api/featuredcategories/?l=english",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.top_sellers?.items ?? []).slice(0, 14) as ApiItem[];
  } catch {
    return [];
  }
}

export default async function TrendingGames({ libraryAppIds }: { libraryAppIds: number[] }) {
  const raw = await fetchTopSellers();

  // Deduplicate by id and drop any items missing an image URL
  const seen = new Set<number>();
  const inLibrary = new Set(libraryAppIds);

  const games: TrendingGame[] = raw
    .filter((g) => {
      if (!g.small_capsule_image || seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    })
    .map((g) => ({
      id:        g.id,
      name:      g.name,
      imageUrl:  g.small_capsule_image,
      inLibrary: inLibrary.has(g.id),
    }));

  if (games.length === 0) return null;

  return <TrendingCarousel games={games} />;
}
