import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Octokit } from "@octokit/rest";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";

  const session = await getServerSession(authOptions);
  const token = (session as any)?.githubAccessToken as string | undefined;
  if (!token) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const octokit = new Octokit({ auth: token });

  const repos: Array<{ id: number; name: string; full_name: string }> = [];
  let page = 1;
  // Fetch up to 200 repos (paginate)
  while (page <= 4) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 50,
      page,
      sort: "updated",
    });
    if (!data.length) break;
    for (const r of data) {
      if (q && !`${r.full_name}`.toLowerCase().includes(q)) continue;
      repos.push({ id: r.id, name: r.name, full_name: r.full_name });
    }
    page += 1;
  }

  return NextResponse.json({ items: repos });
}
