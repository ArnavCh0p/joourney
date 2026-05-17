// PATCH /api/user — update user-level fields (currently: onboardingComplete)

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

export async function PATCH(req: NextRequest) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { onboardingComplete?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { onboardingComplete?: boolean } = {};
  if (typeof body.onboardingComplete === "boolean") {
    data.onboardingComplete = body.onboardingComplete;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/user]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
