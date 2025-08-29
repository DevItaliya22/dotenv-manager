import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const share = await prisma.shareLink.findUnique({
    where: { token: params.token },
    select: { ownerId: true, repoId: true, expiresAt: true },
  });
  if (!share) return new NextResponse("Not found", { status: 404 });
  if (share.expiresAt < new Date())
    return new NextResponse("Expired", { status: 410 });

  const envs = await prisma.envVar.findMany({
    where: { ownerId: share.ownerId, repoId: share.repoId ?? undefined },
    select: { key: true, value: true },
    orderBy: { key: "asc" },
  });
  const content = envs.map((e) => `${e.key}=${e.value}`).join("\n");
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=.env",
    },
  });
}
