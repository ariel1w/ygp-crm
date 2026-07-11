"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { InlineText } from "@/components/InlineEdit";

interface Idea {
  id: string;
  title: string;
  notes: string;
  lastWorkedAt: string;
  archived: boolean;
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}
function lastWorkedLabel(iso: string): string {
  const d = daysSince(iso);
  if (d === 0) return "worked today";
  if (d === 1) return "1d since";
  return `${d}d since`;
}
function staleStyle(iso: string): string {
  const d = daysSince(iso);
  if (d === 0) return "bg-green-100 text-green-700";
  if (d >= 7) return "bg-red-100 text-red-700";
  if (d >= 3) return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-muted";
}

export default function IdeasPanel() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newTitle, setNewTitle] = useState("");

  const sortStale = (arr: Idea[]) =>
    [...arr].sort(
      (a, b) =>
        new Date(a.lastWorkedAt).getTime() - new Date(b.lastWorkedAt).getTime()
    );

  useEffect(() => {
    fetch("/api/ideas")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setIdeas(sortStale(data)))
      .finally(() => setLoading(false));
  }, []);

  const active = useMemo(() => ideas.filter((i) => !i.archived), [ideas]);

  const patchIdea = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      setIdeas((prev) =>
        sortStale(prev.map((i) => (i.id === id ? { ...i, ...updated } : i)))
      );
    },
    []
  );

  const addIdea = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const created = await res.json();
    setIdeas((prev) => sortStale([...prev, created]));
    setNewTitle("");
  };

  const deleteIdea = async (id: string) => {
    if (!confirm("Delete this idea?")) return;
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border"
        style={{ background: "#a855f714", borderLeft: "3px solid #a855f7" }}
      >
        <span className="text-base leading-none">💡</span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold" style={{ color: "#a855f7" }}>
            רעיונות — To Develop
          </h2>
          <p className="text-[11px] text-muted leading-tight">
            Work on one whenever you have a moment. Stale ideas rise to the top.
          </p>
        </div>
      </div>

      {/* Add */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-gray-50">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addIdea()}
          placeholder="Add an idea to develop…"
          dir="auto"
          className="flex-1 min-w-0 text-sm py-1.5 px-2 border border-border rounded-lg"
        />
        <button onClick={addIdea} className="btn btn-primary">
          + Add
        </button>
      </div>

      {loading ? (
        <div className="text-center text-muted py-8 text-sm">Loading…</div>
      ) : active.length === 0 ? (
        <div className="text-center text-muted py-8 text-sm">
          No ideas yet. Add one above. 💭
        </div>
      ) : (
        active.map((idea) => {
          const open = expanded.has(idea.id);
          return (
            <div key={idea.id} className="border-b border-border/60 last:border-b-0">
              <div className="group flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                <button
                  onClick={() => toggle(idea.id)}
                  className="text-muted hover:text-foreground flex-shrink-0 w-4 text-xs"
                  title={open ? "Collapse" : "Expand notes"}
                >
                  {open ? "▾" : "▸"}
                </button>
                <div className="flex-1 min-w-0 text-sm font-semibold" dir="auto">
                  <InlineText
                    value={idea.title}
                    onSave={(val) => patchIdea(idea.id, { title: val })}
                  />
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${staleStyle(
                    idea.lastWorkedAt
                  )}`}
                >
                  {lastWorkedLabel(idea.lastWorkedAt)}
                </span>
                <button
                  onClick={() => deleteIdea(idea.id)}
                  className="text-muted hover:text-danger text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition"
                  title="Delete"
                >
                  ✕
                </button>
              </div>

              {open && (
                <div className="px-3 pb-2 pt-1">
                  <textarea
                    defaultValue={idea.notes}
                    onBlur={(e) => {
                      if (e.target.value !== idea.notes)
                        patchIdea(idea.id, { notes: e.target.value });
                    }}
                    placeholder="Notes, next steps, where you left off…"
                    dir="auto"
                    rows={4}
                    className="w-full text-sm p-2 border border-border rounded-lg resize-y"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <button
                      onClick={() => patchIdea(idea.id, { worked: true })}
                      className="text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-full px-2.5 py-1 transition"
                    >
                      ✓ Worked on it
                    </button>
                    <span className="text-[10px] text-muted">
                      Notes save automatically
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
