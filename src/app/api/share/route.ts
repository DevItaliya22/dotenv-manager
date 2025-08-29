import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

const schema = z.object({
  minutes: z.number().int().positive().max(60).default(10),
  repoFullName: z.string().optional(),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { minutes, repoFullName, name } = parsed.data;

  let repoId: string | undefined = undefined;
  if (repoFullName) {
    const repo = await prisma.repo.findFirst({
      where: { fullName: repoFullName, ownerId: userId },
    });
    if (!repo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }
    repoId = repo.id;
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + minutes * 60_000);

  const created = await prisma.shareLink.create({
    data: { token, ownerId: userId, repoId, name, expiresAt },
    select: { token: true, expiresAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await prisma.shareLink.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      name: true,
      expiresAt: true,
      createdAt: true,
      repo: { select: { fullName: true } },
    },
  });
  return NextResponse.json({ items: links });
}
