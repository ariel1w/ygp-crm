"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { STAGES, STAGE_COLUMNS } from "@/lib/slate-constants";
import { InlineText, InlineSelect, InlineMultiSelect } from "@/components/InlineEdit";

interface SlateProject {
  id: string;
  name: string;
  stage: string;
  [key: string]: string | null;
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function SlatePage() {
  const [projects, setProjects] = useState<SlateProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState("development");

  // Pending manual order for the active stage. null = nothing moved yet.
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  // Which row the grip has armed for dragging, and where the drag started.
  const [dragArmedId, setDragArmedId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const dirty = draftIds !== null;

  const loadData = useCallback(() => {
    fetch("/api/slate")
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Warn before closing the tab or hitting back with an unsaved order.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const saved = useMemo(
    () => projects.filter((p) => p.stage === activeStage),
    [projects, activeStage]
  );

  // What is actually on screen: the pending order if there is one.
  const filtered = useMemo(() => {
    if (!draftIds) return saved;
    const byId = new Map(saved.map((p) => [p.id, p]));
    const ordered = draftIds
      .map((id) => byId.get(id))
      .filter((p): p is SlateProject => !!p);
    // Anything that showed up since the drag started goes on top.
    const extras = saved.filter((p) => !draftIds.includes(p.id));
    return [...extras, ...ordered];
  }, [saved, draftIds]);

  // Rows that sit somewhere different from where they started.
  const movedIds = useMemo(() => {
    if (!draftIds) return new Set<string>();
    const original = saved.map((p) => p.id);
    const moved = new Set<string>();
    filtered.forEach((p, i) => {
      if (original[i] !== p.id) moved.add(p.id);
    });
    return moved;
  }, [draftIds, saved, filtered]);

  const reorder = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= filtered.length || from === to) return;
      setDraftIds(moveItem(filtered.map((p) => p.id), from, to));
    },
    [filtered]
  );

  const saveOrder = async () => {
    if (!draftIds) return;
    setSaving(true);
    try {
      const res = await fetch("/api/slate/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: activeStage,
          ids: filtered.map((p) => p.id),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setProjects(await res.json());
      setDraftIds(null);
    } catch {
      alert("Could not save the new order. Nothing was changed, please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = () => setDraftIds(null);

  // Anything that would navigate away from a pending order has to ask first.
  const confirmDiscard = () =>
    !dirty ||
    confirm(
      "You moved projects but haven't saved the new order.\n\nLeave anyway and lose those moves?"
    );

  const switchStage = (key: string) => {
    if (key === activeStage) return;
    if (!confirmDiscard()) return;
    setDraftIds(null);
    setActiveStage(key);
  };

  const columns = STAGE_COLUMNS[activeStage] || [];
  const stageInfo = STAGES.find((s) => s.key === activeStage);

  const patchProject = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/slate/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    },
    []
  );

  const moveToStage = (id: string, stage: string) => {
    if (!confirmDiscard()) return;
    setDraftIds(null);
    patchProject(id, { stage });
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/slate/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDraftIds((prev) => (prev ? prev.filter((x) => x !== id) : prev));
  };

  const addProject = async () => {
    if (dirty) {
      alert("Save or cancel the new order first, then add a project.");
      return;
    }
    const res = await fetch("/api/slate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", stage: activeStage }),
    });
    const created = await res.json();
    setProjects((prev) => [created, ...prev]);
  };

  // Count per stage
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      counts[p.stage] = (counts[p.stage] || 0) + 1;
    }
    return counts;
  }, [projects]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white drop-shadow">
          {stageInfo?.label || "Central Project List"}
        </h1>
        <button onClick={addProject} className="btn btn-primary">
          + Add Project
        </button>
      </div>

      {/* Stage tabs */}
      <div className="flex items-center gap-1 mb-4 bg-white/90 backdrop-blur rounded-xl p-2 overflow-x-auto">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => switchStage(s.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
              activeStage === s.key
                ? "bg-foreground text-white"
                : "text-muted hover:text-foreground hover:bg-gray-100"
            }`}
          >
            {s.label}
            <span className="ml-1 opacity-60">
              ({stageCounts[s.key] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Unsaved-order bar. Sticks under the nav so it can't be scrolled away. */}
      {dirty && (
        <div className="sticky top-14 z-40 mb-2 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 shadow-md">
          <span className="text-sm font-semibold text-amber-900">
            ⚠ {movedIds.size} project{movedIds.size === 1 ? "" : "s"} moved. Not saved yet.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelOrder}
              disabled={saving}
              className="px-3 py-1 text-xs font-semibold rounded text-muted hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={saveOrder}
              disabled={saving}
              className="btn btn-primary px-3 py-1 text-xs disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save order"}
            </button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="w-14"></th>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th>Move To</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.id}
                draggable={dragArmedId === p.id}
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  if (dragIndex !== i) {
                    reorder(dragIndex, i);
                    setDragIndex(i);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragIndex(null);
                  setDragArmedId(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragArmedId(null);
                }}
                className={
                  movedIds.has(p.id)
                    ? "bg-amber-50"
                    : dragIndex === i
                      ? "opacity-50"
                      : ""
                }
              >
                <td className="whitespace-nowrap pl-1 pr-0">
                  <div className="flex items-center gap-0.5">
                    <span
                      onMouseDown={() => setDragArmedId(p.id)}
                      onMouseUp={() => setDragArmedId(null)}
                      title="Drag to move this project up or down"
                      className="cursor-grab active:cursor-grabbing select-none text-muted hover:text-foreground px-0.5 leading-none"
                    >
                      ⠿
                    </span>
                    <div className="flex flex-col leading-none">
                      <button
                        onClick={() => reorder(i, i - 1)}
                        disabled={i === 0}
                        title="Move up one"
                        className="text-[9px] text-muted hover:text-foreground disabled:opacity-25 disabled:hover:text-muted"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => reorder(i, i + 1)}
                        disabled={i === filtered.length - 1}
                        title="Move down one"
                        className="text-[9px] text-muted hover:text-foreground disabled:opacity-25 disabled:hover:text-muted"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.type === "multiselect" && col.options ? (
                      <InlineMultiSelect
                        value={(p[col.key] as string) || ""}
                        options={col.options.map((o) => ({
                          value: o,
                          label: o,
                        }))}
                        placeholder="—"
                        separator=" או "
                        max={Infinity}
                        onSave={(val) =>
                          patchProject(p.id, { [col.key]: val })
                        }
                      />
                    ) : col.type === "select" && col.options ? (
                      <InlineSelect
                        value={(p[col.key] as string) || ""}
                        options={col.options.map((o) => ({
                          value: o,
                          label: o,
                        }))}
                        placeholder="—"
                        onSave={(val) =>
                          patchProject(p.id, { [col.key]: val })
                        }
                      />
                    ) : (
                      <InlineText
                        value={(p[col.key] as string) || ""}
                        placeholder="—"
                        onSave={(val) =>
                          patchProject(p.id, { [col.key]: val })
                        }
                      />
                    )}
                  </td>
                ))}
                <td>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        moveToStage(p.id, e.target.value);
                      }
                    }}
                    className="text-xs py-0.5 px-1"
                  >
                    <option value="">—</option>
                    {STAGES.filter((s) => s.key !== activeStage).map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="text-muted hover:text-danger text-xs"
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 3}
                  className="text-center text-muted py-8"
                >
                  No projects in this stage.{" "}
                  <button
                    onClick={addProject}
                    className="text-primary hover:underline"
                  >
                    Add one
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
