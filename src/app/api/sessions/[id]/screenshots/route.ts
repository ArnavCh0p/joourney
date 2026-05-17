// POST /api/sessions/:id/screenshots
// Accepts a multipart/form-data body with a "file" field.
// Uploads the image directly to R2 from the server (no presigned URL / no CORS required),
// creates a Screenshot record, and returns { id, url }.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, r2PublicUrl } from "@/lib/r2";

async function resolveUser() {
  const session = await getServerSession(authOptions);
  const steamId = (session?.user as { steamId?: string })?.steamId;
  if (!steamId) return null;
  return prisma.user.findUnique({ where: { steamId } });
}

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const contentType = file.type;
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, and WebP images are supported" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
  }

  const countRows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM "Screenshot" WHERE "sessionId" = ${sessionId}
  `;
  if (Number(countRows[0]?.n ?? 0) >= 10) {
    return NextResponse.json({ error: "Maximum 10 photos per session" }, { status: 400 });
  }

  const filename = (file as File).name ?? "photo";
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const baseName = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
  const r2Key = `screenshots/${user.id}/${sessionId}/${Date.now()}-${baseName}.${ext}`;
  const publicUrl = r2PublicUrl(r2Key);

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadToR2(r2Key, contentType, buffer);

  const screenshotId = crypto.randomUUID();
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO "Screenshot" (id, "r2Key", url, "sessionId", "uploadedAt")
    VALUES (${screenshotId}, ${r2Key}, ${publicUrl}, ${sessionId}, ${now})
  `;

  return NextResponse.json({ id: screenshotId, url: publicUrl }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sessions/:id/screenshots]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
