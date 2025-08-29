import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";
import { z } from "zod";

const schema = z.object({
  repoFullName: z.string().min(1),
  envText: z.string().min(1),
});

function parseDotEnv(text: string): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result.push({ key, value });
  }
  return result;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { repoFullName, envText } = parsed.data;

  const repo = await prisma.repo.upsert({
    where: { fullName: repoFullName },
    update: {},
    create: {
      ownerId: userId,
      fullName: repoFullName,
      name: repoFullName.split("/").pop() ?? repoFullName,
    },
  });

  const pairs = parseDotEnv(envText);
  let upserted = 0;
  for (const { key, value } of pairs) {
    await prisma.envVar.upsert({
      where: { ownerId_repoId_key: { ownerId: userId, repoId: repo.id, key } },
      update: { value },
      create: { ownerId: userId, repoId: repo.id, key, value },
    });
    upserted += 1;
  }

  return NextResponse.json({ count: upserted }, { status: 201 });
}
