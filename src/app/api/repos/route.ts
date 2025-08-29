import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";

  // Get all repos with env status
  const repos = await prisma.repo.findMany({
    where: {
      ownerId: userId,
      fullName: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      fullName: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          envVars: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items: repos });
}
