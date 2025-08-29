import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  repoFullName: z.string().optional(),
  link: z.string().url().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";

  const envs = await prisma.envVar.findMany({
    where: {
      ownerId: userId,
      OR: [
        { key: { contains: q, mode: "insensitive" } },
        { repo: { fullName: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      key: true,
      value: true,
      link: true,
      repo: { select: { id: true, fullName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ items: envs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { key, value, link, repoFullName } = parsed.data;

  let repoId: string | undefined = undefined;
  if (repoFullName) {
    const repo = await prisma.repo.upsert({
      where: { fullName: repoFullName },
      update: {},
      create: {
        ownerId: userId,
        fullName: repoFullName,
        name: repoFullName.split("/").pop() ?? repoFullName,
      },
    });
    repoId = repo.id;
  }

  const created = await prisma.envVar.create({
    data: { ownerId: userId, repoId, key, value, link },
    select: { id: true, key: true, value: true, link: true },
  });
  return NextResponse.json(created, { status: 201 });
}
