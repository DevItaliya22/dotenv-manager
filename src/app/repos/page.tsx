"use client";
import { useEffect, useState } from "react";

type Repo = { id: number; name: string; full_name: string };

export default function ReposPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [envText, setEnvText] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/github/repos?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setItems(d.items ?? []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [q]);

  const openModal = (repo: Repo) => {
    setSelectedRepo(repo);
    setEnvText("");
    setShowModal(true);
  };

  const submitEnv = async () => {
    if (!selectedRepo) return;
    await fetch("/api/env/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoFullName: selectedRepo.full_name, envText }),
    });
    setShowModal(false);
    setEnvText("");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">GitHub Repositories</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search repos..."
        className="border px-3 py-2 rounded w-full max-w-md"
      />
      {loading ? <p>Loading...</p> : null}
      <ul className="divide-y">
        {items.map((r) => (
          <li key={r.id} className="py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="truncate">{r.full_name}</span>
              <button
                className="border px-3 py-1 rounded"
                onClick={() => openModal(r)}
              >
                Add .env
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && selectedRepo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-md border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Add .env</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedRepo.full_name}
                </p>
                <a
                  className="text-xs text-blue-600"
                  href={`https://github.com/${selectedRepo.full_name}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on GitHub
                </a>
              </div>
              <button
                className="border rounded px-2 py-1"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
            <textarea
              value={envText}
              onChange={(e) => setEnvText(e.target.value)}
              className="w-full min-h-[300px] border rounded p-2 font-mono"
              placeholder={`# Paste your .env content here\nAPI_KEY=...\nNEXT_PUBLIC_...=...`}
            />
            <div className="flex justify-end gap-2">
              <button
                className="border rounded px-3 py-1"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="border rounded px-3 py-1" onClick={submitEnv}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
