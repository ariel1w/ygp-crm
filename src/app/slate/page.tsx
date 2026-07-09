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

export default function SlatePage() {
  const [projects, setProjects] = useState<SlateProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState("development");

  const loadData = useCallback(() => {
    fetch("/api/slate")
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(
    () => projects.filter((p) => p.stage === activeStage),
    [projects, activeStage]
  );

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

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/slate/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const addProject = async () => {
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
            onClick={() => setActiveStage(s.key)}
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

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th>Move To</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
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
                        max={3}
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
                        patchProject(p.id, { stage: e.target.value });
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
                  colSpan={columns.length + 2}
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
