import { prisma } from "../../../lib/prisma";

export default async function SharePage({
  params,
}: {
  params: { token: string };
}) {
  const share = await prisma.shareLink.findUnique({
    where: { token: params.token },
    include: {
      repo: { select: { fullName: true } },
    },
  });
  if (!share || share.expiresAt < new Date()) {
    return (
      <div className="p-6">
        <h1>Link expired or invalid</h1>
      </div>
    );
  }

  const envs = await prisma.envVar.findMany({
    where: { ownerId: share.ownerId, repoId: share.repoId ?? undefined },
    select: { id: true, key: true, value: true, link: true },
    orderBy: { key: "asc" },
  });

  return (
    <div className="p-6">
      <h1>
        Shared envs {share.repo ? `for ${share.repo.fullName}` : "(global)"}
      </h1>
      <ul>
        {envs.map((e) => (
          <li key={e.id} className="py-2">
            <div className="flex items-center gap-2">
              <span>{e.key}</span>
              <button onClick={() => navigator.clipboard.writeText(e.value)}>
                Copy
              </button>
              {e.link ? (
                <a
                  href={e.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600"
                >
                  Doc
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-gray-500">
        Expires at: {share.expiresAt.toISOString()}
      </p>
    </div>
  );
}
