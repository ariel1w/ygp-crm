"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROJECT_STATUSES, statusInfo } from "@/lib/project-status";

interface ProjectRow {
  id: string;
  name: string;
  counts: Record<string, number>;
  pitchCount: number;
  contactCount: number;
  lastActivity: string | null;
}

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
    : "—";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const loadProjects = () => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setAdding(false);
    loadProjects();
  };

  // Whatever moved most recently sits at the top. Projects nobody has touched
  // since the original import sink to the bottom on their own.
  const sorted = [...projects].sort((a, b) => {
    if (!a.lastActivity && !b.lastActivity) return a.name.localeCompare(b.name);
    if (!a.lastActivity) return 1;
    if (!b.lastActivity) return -1;
    return b.lastActivity.localeCompare(a.lastActivity);
  });

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>

      <form onSubmit={handleAdd} className="flex gap-3 mb-4">
        <input
          placeholder="New project name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <button
          type="submit"
          className="btn btn-primary whitespace-nowrap"
          disabled={adding}
        >
          {adding ? "Adding..." : "Add Project"}
        </button>
      </form>

      <div className="card p-0 overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Where it stands</th>
              <th className="whitespace-nowrap">Last move</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {p.name}
                  </Link>
                </td>
                <td>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {p.pitchCount > 0 && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: statusInfo("topitch").bg,
                          color: statusInfo("topitch").color,
                        }}
                      >
                        {p.pitchCount} to pitch
                      </span>
                    )}
                    {PROJECT_STATUSES.filter((s) => p.counts[s.key]).map((s) => (
                      <span
                        key={s.key}
                        className="badge"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        {p.counts[s.key]} {s.label.toLowerCase()}
                      </span>
                    ))}
                    {!p.pitchCount && !p.contactCount && (
                      <span className="text-muted text-sm italic">
                        Nobody on it yet
                      </span>
                    )}
                  </span>
                </td>
                <td className="text-sm text-muted whitespace-nowrap">
                  {fmt(p.lastActivity)}
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-8">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
