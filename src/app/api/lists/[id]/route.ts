// DELETE /api/lists/:id — delete a list (and all its entries via cascade)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function resolveUser() {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return null;
  return prisma.user.findUnique({ where: { steamId } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
  if (!list || list.userId !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.list.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
