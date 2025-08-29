"use client";

import { useEffect, useState } from "react";

type ShareData = {
  share: {
    id: string;
    token: string;
    name?: string | null;
    expiresAt: string;
    repo?: { fullName: string } | null;
  };
  envs: Array<{
    id: string;
    key: string;
    value: string;
    link?: string | null;
  }>;
};

export default function SharePageClient({ token }: { token: string }) {
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${token}/data`)
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) throw new Error("Link not found");
          if (r.status === 410) throw new Error("Link expired");
          throw new Error("Failed to load share data");
        }
        return r.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-600">Error</h1>
        <p className="text-gray-600">{error || "Failed to load share data"}</p>
      </div>
    );
  }

  const { share, envs } = data;
  const isExpired = new Date(share.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-600">Link Expired</h1>
        <p className="text-gray-600">This share link has expired.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Shared Environment Variables</h1>
        <p className="text-sm text-gray-600">
          {share.repo ? `Repository: ${share.repo.fullName}` : "Global scope"}
        </p>
        {share.name && (
          <p className="text-sm text-gray-600">Name: {share.name}</p>
        )}
      </div>

      {envs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No environment variables found.
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-accent/30 text-left">
              <tr>
                <th className="p-2">Key</th>
                <th className="p-2">Value</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {envs.map((env) => (
                <tr key={env.id} className="border-t">
                  <td className="p-2 font-mono text-sm">{env.key}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {env.value.length > 50
                          ? `${env.value.substring(0, 50)}...`
                          : env.value}
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        className="border rounded px-2 py-1 text-xs hover:bg-accent"
                        onClick={() => copyValue(env.value)}
                      >
                        Copy
                      </button>
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
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-gray-500">
          Expires at: {new Date(share.expiresAt).toLocaleString()}
        </p>
        <div className="flex gap-2">
          <a
            className="border rounded px-3 py-1 text-sm hover:bg-accent"
            href={`/api/share/${share.token}/env`}
            target="_blank"
            rel="noreferrer"
          >
            Download .env
          </a>
        </div>
      </div>
    </div>
  );
}
