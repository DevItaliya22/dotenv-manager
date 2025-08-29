"use client";

import { useEffect, useState } from "react";

type ShareItem = {
  id: string;
  token: string;
  name?: string | null;
  createdAt: string;
  expiresAt: string;
  repo?: { fullName: string } | null;
};

export default function ShareIndexPage() {
  const [items, setItems] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/share")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const createLink = async () => {
    setCreating(true);
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes }),
    });
    setCreating(false);
    if (!res.ok) return;
    const d = await res.json();
    const url = `${location.origin}/share/${d.token}`;
    await navigator.clipboard.writeText(url);
    const list = await fetch("/api/share").then((r) => r.json());
    setItems(list.items ?? []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Share Links</h1>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={60}
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value || "10"))}
          className="w-28 border rounded px-2 py-1"
          placeholder="Minutes"
        />
        <button
          className="border rounded px-3 py-1"
          onClick={createLink}
          disabled={creating}
        >
          {creating ? "Creating..." : "Add Link"}
        </button>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-accent/30 text-left">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Scope</th>
              <th className="p-2">Created</th>
              <th className="p-2">Expires</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const url = `${location.origin}/share/${it.token}`;
              const isExpired = new Date(it.expiresAt) < new Date();
              return (
                <tr
                  key={it.id}
                  className={`border-t ${isExpired ? "opacity-60" : ""}`}
                >
                  <td className="p-2">
                    {it.name ?? "Untitled"}{" "}
                    {isExpired ? (
                      <span className="text-xs text-red-600">(expired)</span>
                    ) : null}
                  </td>
                  <td className="p-2">{it.repo?.fullName ?? "(global)"}</td>
                  <td className="p-2">
                    {new Date(it.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2">
                    {new Date(it.expiresAt).toLocaleString()}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <a
                        className="border rounded px-2 py-1"
                        href={`/share/${it.token}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Eye
                      </a>
                      <button
                        className="border rounded px-2 py-1"
                        onClick={() => navigator.clipboard.writeText(url)}
                      >
                        Copy link
                      </button>
                      <a
                        className="border rounded px-2 py-1"
                        href={`/api/share/${it.token}/env`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && items.length === 0 ? (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={5}>
                  No share links yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
