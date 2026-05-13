import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ListsManager from "@/components/ListsManager";

export default async function ListsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const steamId = (session.user as { steamId?: string }).steamId;
  if (!steamId) redirect("/");

  const dbUser = await prisma.user.findUnique({ where: { steamId } });
  if (!dbUser) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listModel = (prisma as any).list as typeof prisma.list | undefined;
  const rawLists = listModel
    ? await listModel.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { entries: true } },
          entries: {
            include: { shelfEntry: { select: { steamAppId: true } } },
            take: 4,
            orderBy: { addedAt: "asc" },
          },
        },
      }).catch(() => [])
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lists = rawLists.map((l: any) => ({
    id: l.id,
    name: l.name,
    entryCount: l._count.entries,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    previewAppIds: l.entries.map((e: any) => e.shelfEntry.steamAppId),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 tracking-tight">My Lists</h1>
        <p className="mt-1 text-sm text-slate-400">
          {lists.length} {lists.length === 1 ? "list" : "lists"}
        </p>
      </div>
      <ListsManager initialLists={lists} />
    </div>
  );
}
