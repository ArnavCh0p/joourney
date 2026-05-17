import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ListDetail from "@/components/ListDetail";

type Params = { id: string };

export default async function ListDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const steamId = (session.user as { steamId?: string }).steamId;
  if (!steamId) redirect("/");

  const dbUser = await prisma.user.findUnique({ where: { steamId } });
  if (!dbUser) redirect("/");

  // Verify list ownership
  const listMeta = await prisma.$queryRaw<{ id: string; name: string; description: string | null; userId: string }[]>`
    SELECT id, name, description, "userId" FROM "List" WHERE id = ${id}
  `.then((rows) => rows[0] ?? null).catch(() => null);

  if (!listMeta || listMeta.userId !== dbUser.id) notFound();

  // Fetch entries with rank via raw SQL (rank col added via db push, client not regenerated)
  type EntryRow = {
    shelfEntryId: string;
    addedAt: Date;
    rank: number | null;
    steamAppId: number;
    gameName: string;
    coverUrl: string | null;
    platform: string;
    status: string;
    rating: number | null;
    playtimeMinutes: number;
    tags: string[];
    isMultiplayer: boolean;
  };

  const rows = await prisma.$queryRaw<EntryRow[]>`
    SELECT
      le."shelfEntryId",
      le."addedAt",
      le."rank",
      se."steamAppId",
      se."gameName",
      se."coverUrl",
      se."platform",
      se."status",
      se."rating",
      se."playtimeMinutes",
      se."tags",
      se."isMultiplayer"
    FROM "ListEntry" le
    JOIN "ShelfEntry" se ON le."shelfEntryId" = se.id
    WHERE le."listId" = ${id}
    ORDER BY le."rank" ASC NULLS LAST, le."addedAt" ASC
  `.catch(() => [] as EntryRow[]);

  // Serialize for client (BigInt, Date → primitives)
  const games = rows.map((r) => ({
    shelfEntryId:    String(r.shelfEntryId),
    addedAt:         r.addedAt instanceof Date ? r.addedAt.toISOString() : String(r.addedAt),
    rank:            r.rank != null ? Number(r.rank) : null,
    steamAppId:      Number(r.steamAppId),
    gameName:        String(r.gameName),
    coverUrl:        r.coverUrl ? String(r.coverUrl) : null,
    platform:        String(r.platform ?? "Steam"),
    status:          String(r.status),
    rating:          r.rating != null ? Number(r.rating) : null,
    playtimeMinutes: Number(r.playtimeMinutes),
    tags:            Array.isArray(r.tags) ? r.tags : [],
    isMultiplayer:   Boolean(r.isMultiplayer),
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/lists"
        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        ← My Lists
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-100 tracking-tight">{listMeta.name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {games.length} {games.length === 1 ? "game" : "games"}
        </p>
      </div>

      <ListDetail listId={id} initialGames={games} initialDescription={listMeta.description ?? null} />
    </div>
  );
}
