"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type EnvVar = {
  id: string;
  key: string;
  value: string;
  link?: string | null;
  repo?: { id: string; fullName: string } | null;
};

export default function EnvsPage() {
  const [envs, setEnvs] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const repoFilter = searchParams.get("repo");

  useEffect(() => {
    setLoading(true);
    const query = repoFilter
      ? `?q=${encodeURIComponent(repoFilter)}`
      : `?q=${encodeURIComponent(searchQuery)}`;
    fetch(`/api/env${query}`)
      .then((r) => r.json())
      .then((d) => setEnvs(d.items ?? []))
      .finally(() => setLoading(false));
  }, [searchQuery, repoFilter]);

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const copyEnvFile = async () => {
    if (!repoFilter) return;
    try {
      const response = await fetch(
        `/api/env/download?repo=${encodeURIComponent(repoFilter)}`
      );
      if (response.ok) {
        const content = await response.text();
        await navigator.clipboard.writeText(content);
      }
    } catch (error) {
      console.error("Failed to copy env file:", error);
    }
  };

  const downloadEnvFile = () => {
    if (!repoFilter) return;
    const link = document.createElement("a");
    link.href = `/api/env/download?repo=${encodeURIComponent(repoFilter)}`;
    link.download = ".env";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEnvs = envs.filter((env) => {
    if (repoFilter) return true; // Already filtered by API
    if (!searchQuery) return true;
    return (
      env.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      env.repo?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Environment Variables
          {repoFilter && ` - ${repoFilter}`}
        </h1>
        {repoFilter && (
          <div className="flex items-center gap-2">
            <button
              className="border rounded px-3 py-1 text-sm hover:bg-accent"
              onClick={copyEnvFile}
            >
              Copy .env
            </button>
            <button
              className="border rounded px-3 py-1 text-sm hover:bg-accent"
              onClick={downloadEnvFile}
            >
              Download .env
            </button>
          </div>
        )}
      </div>

      {!repoFilter && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search env vars or repos..."
          className="border px-3 py-2 rounded w-full max-w-md"
        />
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-accent/30 text-left">
              <tr>
                <th className="p-2">Key</th>
                <th className="p-2">Value</th>
                <th className="p-2">Repository</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnvs.map((env) => (
                <tr key={env.id} className="border-t">
                  <td className="p-2 font-mono text-sm">{env.key}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {env.value.length > 50
                          ? `${env.value.substring(0, 50)}...`
                          : env.value}
                      </span>
                      <button
                        className="border rounded px-2 py-1 text-xs hover:bg-accent"
                        onClick={() => copyValue(env.value)}
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td className="p-2">
                    {env.repo ? (
                      <span className="text-sm">{env.repo.fullName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Global
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      {env.link && (
                        <a
                          className="border rounded px-2 py-1 text-xs hover:bg-accent"
                          href={env.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Doc
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredEnvs.length === 0 ? (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={4}>
                    No environment variables found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
