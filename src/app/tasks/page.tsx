"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { InlineText } from "@/components/InlineEdit";
import { TASK_CATEGORIES, categoryLabel } from "@/lib/task-constants";

interface Task {
  id: string;
  content: string;
  category: string;
  important: boolean;
  done: boolean;
  addedAt: string;
  completedAt: string | null;
  source: string;
}

function daysWaiting(addedAt: string): number {
  const ms = Date.now() - new Date(addedAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

function waitingLabel(addedAt: string): string {
  const d = daysWaiting(addedAt);
  if (d === 0) return "today";
  if (d === 1) return "1 day";
  return `${d} days`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "archive">("active");
  const [flat, setFlat] = useState(false); // false = grouped, true = oldest-waiting flat list
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("admin");

  const loadData = useCallback(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setTasks(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const patchTask = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    },
    []
  );

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addTask = async () => {
    const content = newContent.trim();
    if (!content) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, category: newCategory }),
    });
    const created = await res.json();
    setTasks((prev) => [created, ...prev]);
    setNewContent("");
  };

  const active = useMemo(() => tasks.filter((t) => !t.done), [tasks]);
  const archived = useMemo(() => tasks.filter((t) => t.done), [tasks]);

  // important first, then oldest waiting first
  const byImportantThenAge = (a: Task, b: Task) => {
    if (a.important !== b.important) return a.important ? -1 : 1;
    return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
  };

  const flatSorted = useMemo(
    () => [...active].sort(byImportantThenAge),
    [active]
  );

  const grouped = useMemo(() => {
    return TASK_CATEGORIES.map((cat) => ({
      ...cat,
      items: active
        .filter((t) => t.category === cat.key)
        .sort(byImportantThenAge),
    })).filter((g) => g.items.length > 0);
  }, [active]);

  const importantCount = active.filter((t) => t.important).length;

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-xl font-bold text-white drop-shadow">
          Ariel — My Tasks
        </h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-white/90 rounded-full px-3 py-1 font-semibold text-foreground">
            {active.length} open
          </span>
          <span className="bg-white/90 rounded-full px-3 py-1 font-semibold text-foreground">
            ⭐ {importantCount} important
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 mb-4 bg-white/90 backdrop-blur rounded-xl p-2 flex-wrap">
        <button
          onClick={() => setView("active")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            view === "active"
              ? "bg-foreground text-white"
              : "text-muted hover:text-foreground hover:bg-gray-100"
          }`}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setView("archive")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            view === "archive"
              ? "bg-foreground text-white"
              : "text-muted hover:text-foreground hover:bg-gray-100"
          }`}
        >
          Archive ({archived.length})
        </button>
        {view === "active" && (
          <button
            onClick={() => setFlat((f) => !f)}
            className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-full text-muted hover:text-foreground hover:bg-gray-100"
          >
            {flat ? "▤ Group by category" : "↕ Sort by oldest waiting"}
          </button>
        )}
      </div>

      {/* Add task */}
      {view === "active" && (
        <div className="card p-3 mb-4 flex items-center gap-2 flex-wrap">
          <input
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a task…"
            dir="auto"
            className="flex-1 min-w-[200px] text-sm py-1.5 px-2 border border-border rounded"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="text-sm py-1.5 px-2 border border-border rounded"
          >
            {TASK_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <button onClick={addTask} className="btn btn-primary">
            + Add
          </button>
        </div>
      )}

      {/* Active view */}
      {view === "active" &&
        (flat ? (
          <div className="card p-0 overflow-hidden">
            {flatSorted.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onPatch={patchTask}
                onDelete={deleteTask}
                showCategory
              />
            ))}
            {flatSorted.length === 0 && (
              <div className="text-center text-muted py-8 text-sm">
                No open tasks. 🎉
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.key} className="card p-0 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-bold text-foreground">{g.label}</h2>
                  <span className="text-xs text-muted">{g.items.length}</span>
                </div>
                {g.items.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onPatch={patchTask}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="card text-center text-muted py-8 text-sm">
                No open tasks. 🎉
              </div>
            )}
          </div>
        ))}

      {/* Archive view */}
      {view === "archive" && (
        <div className="card p-0 overflow-hidden">
          {archived.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-b-0"
            >
              <span className="text-success text-sm">✓</span>
              <span dir="auto" className="flex-1 text-sm text-muted line-through">
                {t.content}
              </span>
              {t.completedAt && (
                <span className="text-xs text-muted whitespace-nowrap">
                  done {formatDate(t.completedAt)}
                </span>
              )}
              <button
                onClick={() => patchTask(t.id, { done: false })}
                className="text-xs text-primary hover:underline whitespace-nowrap"
              >
                restore
              </button>
              <button
                onClick={() => deleteTask(t.id)}
                className="text-muted hover:text-danger text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          {archived.length === 0 && (
            <div className="text-center text-muted py-8 text-sm">
              Nothing archived yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onPatch,
  onDelete,
  showCategory = false,
}: {
  task: Task;
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  showCategory?: boolean;
}) {
  const d = daysWaiting(task.addedAt);
  const urgent = d >= 14;
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-b-0 hover:bg-gray-50/60">
      {/* Done */}
      <button
        onClick={() => {
          if (confirm("Mark this task as done?")) onPatch(task.id, { done: true });
        }}
        title="Mark done"
        className="w-5 h-5 rounded-full border-2 border-border hover:border-success hover:bg-success/10 flex-shrink-0"
      />
      {/* Important */}
      <button
        onClick={() => onPatch(task.id, { important: !task.important })}
        title={task.important ? "Important" : "Mark important"}
        className={`text-lg leading-none flex-shrink-0 ${
          task.important ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
        }`}
      >
        {task.important ? "★" : "☆"}
      </button>
      {/* Content */}
      <div className="flex-1 min-w-0" dir="auto">
        <InlineText
          value={task.content}
          onSave={(val) => onPatch(task.id, { content: val })}
        />
      </div>
      {showCategory && (
        <span className="text-[10px] text-muted whitespace-nowrap hidden sm:inline">
          {categoryLabel(task.category).split(" / ")[0]}
        </span>
      )}
      {/* Age */}
      <span
        className={`text-xs whitespace-nowrap ${
          urgent ? "text-danger font-semibold" : "text-muted"
        }`}
        title={`Added ${formatDate(task.addedAt)}`}
      >
        {waitingLabel(task.addedAt)}
      </span>
      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="text-muted hover:text-danger text-xs flex-shrink-0"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}
