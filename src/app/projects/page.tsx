"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  _count: { contacts: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
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

  if (loading)
    return <p className="text-muted text-sm py-8">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
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
              <th>Contacts Sent To</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {p.name}
                  </Link>
                </td>
                <td>{p._count.contacts}</td>
                <td>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-sm font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    View
                  </Link>
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
