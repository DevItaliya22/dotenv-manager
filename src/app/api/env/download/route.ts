import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const repoFullName = url.searchParams.get("repo");

  if (!repoFullName) {
    return NextResponse.json(
      { error: "Repo parameter required" },
      { status: 400 }
    );
  }

  // Find the repo
  const repo = await prisma.repo.findFirst({
    where: { fullName: repoFullName, ownerId: userId },
  });

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  // Get env vars for this repo
  const envs = await prisma.envVar.findMany({
    where: { ownerId: userId, repoId: repo.id },
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
