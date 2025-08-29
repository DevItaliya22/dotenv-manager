"use client";

import { useEffect, useState } from "react";

type RepoWithEnvStatus = {
  id: string;
  fullName: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    envVars: number;
  };
};

type ShareItem = {
  id: string;
  token: string;
  name?: string | null;
  createdAt: string;
  expiresAt: string;
  repo?: { fullName: string } | null;
};

export default function ShareIndexPage() {
  const [allRepos, setAllRepos] = useState<RepoWithEnvStatus[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/repos").then((r) => r.json()),
      fetch("/api/share").then((r) => r.json()),
    ])
      .then(([reposData, shareData]) => {
        setAllRepos(reposData.items ?? []);
        setShareLinks(shareData.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Client-side filtering
  const filteredRepos = allRepos.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createLink = async (repoId: string | null, repoName?: string) => {
    setCreating(true);
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        minutes,
        repoId,
        name: repoName ? `${repoName} env vars` : "Global env vars",
      }),
    });
    setCreating(false);
    if (!res.ok) return;
    const d = await res.json();
    const url = `${window.location.origin}/share/${d.token}`;
    await navigator.clipboard.writeText(url);

    // Refresh share links
    const shareData = await fetch("/api/share").then((r) => r.json());
    setShareLinks(shareData.items ?? []);
  };

  const getShareLinkForRepo = (repoId: string | null) => {
    return shareLinks.find(
      (link) =>
        link.repo?.fullName ===
        (repoId ? allRepos.find((r) => r.id === repoId)?.fullName : null)
    );
  };

  const copyEnvFile = async (repoFullName: string) => {
    try {
      const response = await fetch(
        `/api/env/download?repo=${encodeURIComponent(repoFullName)}`
      );
      if (response.ok) {
        const content = await response.text();
        await navigator.clipboard.writeText(content);
      }
    } catch (error) {
      console.error("Failed to copy env file:", error);
    }
  };

  const downloadEnvFile = (repoFullName: string) => {
    const link = document.createElement("a");
    link.href = `/api/env/download?repo=${encodeURIComponent(repoFullName)}`;
    link.download = ".env";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Repository Environment Variables
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search repositories..."
          className="flex-1 border rounded px-3 py-2"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={60}
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value || "10"))}
            className="w-20 border rounded px-2 py-1"
            placeholder="Min"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* Repositories section */}
          <div className="rounded-md border">
            <div className="p-4 bg-accent/30 border-b">
              <h2 className="font-medium">Repository Environment Variables</h2>
              <p className="text-sm text-muted-foreground">
                Environment variables organized by repository
              </p>
            </div>
            {filteredRepos.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery
                  ? `No repositories found matching "${searchQuery}".`
                  : "No repositories found. Add environment variables to repositories first."}
              </div>
            ) : (
              <div className="divide-y">
                {filteredRepos.map((repo) => {
                  const hasEnvVars = repo._count.envVars > 0;
                  const shareLink = getShareLinkForRepo(repo.id);
                  const isExpired = shareLink
                    ? new Date(shareLink.expiresAt) < new Date()
                    : false;

                  return (
                    <div key={repo.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{repo.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {hasEnvVars ? (
                                <span className="text-green-600">
                                  {repo._count.envVars} environment variable
                                  {repo._count.envVars !== 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="text-gray-500">
                                  No environment variables
                                </span>
                              )}
                            </div>
                          </div>
                          {hasEnvVars && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Has .env
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasEnvVars && (
                            <>
                              <button
                                className="border rounded px-3 py-1 text-sm hover:bg-accent"
                                onClick={() => createLink(repo.id, repo.name)}
                                disabled={creating}
                              >
                                {creating ? "Creating..." : "Create Link"}
                              </button>
                              <button
                                className="border rounded px-3 py-1 text-sm hover:bg-accent"
                                onClick={() => copyEnvFile(repo.fullName)}
                              >
                                Copy .env
                              </button>
                              <button
                                className="border rounded px-3 py-1 text-sm hover:bg-accent"
                                onClick={() => downloadEnvFile(repo.fullName)}
                              >
                                Download .env
                              </button>
                              <a
                                className="border rounded px-3 py-1 text-sm hover:bg-accent"
                                href={`/envs?repo=${encodeURIComponent(
                                  repo.fullName
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                            </>
                          )}
                          {!hasEnvVars && (
                            <a
                              className="border rounded px-3 py-1 text-sm hover:bg-accent"
                              href="/repos"
                            >
                              Add .env
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Show existing share link if any */}
                      {shareLink && hasEnvVars && (
                        <div className="mt-3 p-3 bg-accent/20 rounded border">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span>Share link:</span>
                              <span
                                className={`font-mono text-xs ${
                                  isExpired ? "text-red-600" : "text-green-600"
                                }`}
                              >
                                {shareLink.name || "Untitled"}
                                {isExpired && " (expired)"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                className="border rounded px-2 py-1 text-xs hover:bg-accent"
                                href={`/share/${shareLink.token}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Eye
                              </a>
                              <button
                                className="border rounded px-2 py-1 text-xs hover:bg-accent"
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/share/${shareLink.token}`
                                  )
                                }
                              >
                                Copy link
                              </button>
                              <a
                                className="border rounded px-2 py-1 text-xs hover:bg-accent"
                                href={`/api/share/${shareLink.token}/env`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
