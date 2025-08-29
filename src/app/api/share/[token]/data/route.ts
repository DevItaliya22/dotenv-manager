import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const share = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      repo: { select: { fullName: true } },
    },
  });

  if (!share) {
    return NextResponse.json(
      { error: "Share link not found" },
      { status: 404 }
    );
  }

  if (share.expiresAt < new Date()) {
    return NextResponse.json({ error: "Share link expired" }, { status: 410 });
  }

  const envs = await prisma.envVar.findMany({
    where: { ownerId: share.ownerId, repoId: share.repoId ?? undefined },
    select: { id: true, key: true, value: true, link: true },
    orderBy: { key: "asc" },
  });

  return NextResponse.json({
    share: {
      id: share.id,
      token: share.token,
      name: share.name,
      expiresAt: share.expiresAt.toISOString(),
      repo: share.repo,
    },
    envs,
  });
}
