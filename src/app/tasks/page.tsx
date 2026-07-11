"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { InlineText } from "@/components/InlineEdit";
import IdeasPanel from "@/components/IdeasPanel";
import {
  TASK_CATEGORIES,
  categoryColor,
  categoryIcon,
} from "@/lib/task-constants";

interface Task {
  id: string;
  content: string;
  list: string;
  category: string;
  tags: string;
  important: boolean;
  done: boolean;
  addedAt: string;
  completedAt: string | null;
  source: string;
}

type Mode = "category" | "topic" | "oldest";

function daysWaiting(addedAt: string): number {
  const ms = Date.now() - new Date(addedAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}
function waitingLabel(addedAt: string): string {
  const d = daysWaiting(addedAt);
  if (d === 0) return "today";
  if (d === 1) return "1d";
  return `${d}d`;
}
function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}
function splitTags(s: string): string[] {
  return (s || "").split(",").map((x) => x.trim()).filter(Boolean);
}
// stable hue per topic so each tag keeps a consistent color
function topicHue(tag: string): number {
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function TopicChip({
  tag,
  active,
  onClick,
}: {
  tag: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const hue = topicHue(tag);
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `hsl(${hue} 75% 45%)` : `hsl(${hue} 90% 95%)`,
        color: active ? "#fff" : `hsl(${hue} 65% 32%)`,
        borderColor: `hsl(${hue} 70% ${active ? 45 : 80}%)`,
      }}
      className="text-[11px] leading-none px-1.5 py-0.5 rounded-full border font-semibold whitespace-nowrap hover:brightness-95 transition"
    >
      #{tag}
    </button>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<"tasks" | "yoav">("tasks");
  const [view, setView] = useState<"active" | "archive">("active");
  const [mode, setMode] = useState<Mode>("category");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("admin");
  const [newYoav, setNewYoav] = useState("");

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

  const editTags = (t: Task) => {
    const next = window.prompt(
      "Topics for this task (comma-separated):",
      t.tags
    );
    if (next === null) return;
    const cleaned = splitTags(next).join(", ");
    patchTask(t.id, { tags: cleaned });
  };

  const addTask = async () => {
    const content = newContent.trim();
    if (!content) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        category: newCategory,
        tags: topicFilter ?? "",
      }),
    });
    const created = await res.json();
    setTasks((prev) => [created, ...prev]);
    setNewContent("");
  };

  const addYoav = async () => {
    const content = newYoav.trim();
    if (!content) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, list: "yoav" }),
    });
    const created = await res.json();
    setTasks((prev) => [created, ...prev]);
    setNewYoav("");
  };

  const taskItems = useMemo(
    () => tasks.filter((t) => (t.list ?? "tasks") === "tasks"),
    [tasks]
  );
  const yoavAll = useMemo(() => tasks.filter((t) => t.list === "yoav"), [tasks]);
  const yoavActive = useMemo(() => yoavAll.filter((t) => !t.done), [yoavAll]);
  const yoavCovered = useMemo(() => yoavAll.filter((t) => t.done), [yoavAll]);

  const active = useMemo(() => taskItems.filter((t) => !t.done), [taskItems]);
  const archived = useMemo(() => taskItems.filter((t) => t.done), [taskItems]);

  const byImportantThenAge = (a: Task, b: Task) => {
    if (a.important !== b.important) return a.important ? -1 : 1;
    return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
  };

  const activeFiltered = useMemo(
    () =>
      topicFilter
        ? active.filter((t) => splitTags(t.tags).includes(topicFilter))
        : active,
    [active, topicFilter]
  );

  const flatSorted = useMemo(
    () => [...activeFiltered].sort(byImportantThenAge),
    [activeFiltered]
  );

  const grouped = useMemo(
    () =>
      TASK_CATEGORIES.map((cat) => ({
        ...cat,
        items: activeFiltered
          .filter((t) => t.category === cat.key)
          .sort(byImportantThenAge),
      })).filter((g) => g.items.length > 0),
    [activeFiltered]
  );

  const topicGroups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of activeFiltered) {
      const tags = splitTags(t.tags);
      const keys = tags.length ? tags : ["__none"];
      for (const k of keys) {
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(t);
      }
    }
    const arr = [...map.entries()].map(([tag, items]) => ({
      tag,
      items: items.sort(byImportantThenAge),
    }));
    arr.sort((a, b) =>
      a.tag === "__none" ? 1 : b.tag === "__none" ? -1 : b.items.length - a.items.length
    );
    return arr;
  }, [activeFiltered]);

  const importantCount = active.filter((t) => t.important).length;

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );

  const modeBtn = (m: Mode, label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
        mode === m
          ? "bg-foreground text-white"
          : "text-muted hover:text-foreground hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h1 className="text-xl font-bold text-white drop-shadow">Ariel</h1>
        <div className="flex items-center gap-2 text-xs">
          {mainTab === "tasks" ? (
            <>
              <span className="bg-white/90 rounded-full px-3 py-1 font-semibold text-foreground">
                {active.length} open
              </span>
              <span className="bg-white/90 rounded-full px-3 py-1 font-semibold text-foreground">
                ⭐ {importantCount}
              </span>
            </>
          ) : (
            <span className="bg-white/90 rounded-full px-3 py-1 font-semibold text-foreground">
              {yoavActive.length} for Sunday
            </span>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-1 mb-2 bg-white/90 backdrop-blur rounded-xl p-1.5 shadow-sm">
        <button
          onClick={() => setMainTab("tasks")}
          className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors ${
            mainTab === "tasks"
              ? "bg-foreground text-white"
              : "text-muted hover:text-foreground hover:bg-gray-100"
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setMainTab("yoav")}
          className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors ${
            mainTab === "yoav"
              ? "bg-foreground text-white"
              : "text-muted hover:text-foreground hover:bg-gray-100"
          }`}
        >
          For Yoav (Sunday)
        </button>
      </div>

      {mainTab === "tasks" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <div className="min-w-0">
          {/* Controls */}
          <div className="flex items-center gap-2 mb-2 bg-white/90 backdrop-blur rounded-xl p-1.5 shadow-sm flex-wrap">
            <button
              onClick={() => setView("active")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                view === "active"
                  ? "bg-foreground text-white"
                  : "text-muted hover:text-foreground hover:bg-gray-100"
              }`}
            >
              Active ({active.length})
            </button>
            <button
              onClick={() => setView("archive")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                view === "archive"
                  ? "bg-foreground text-white"
                  : "text-muted hover:text-foreground hover:bg-gray-100"
              }`}
            >
              Archive ({archived.length})
            </button>
            {view === "active" && (
              <div className="ml-auto flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
                <span className="text-[10px] text-muted px-1 hidden sm:inline">
                  view
                </span>
                {modeBtn("category", "Category")}
                {modeBtn("topic", "Topic")}
                {modeBtn("oldest", "Oldest")}
              </div>
            )}
          </div>

          {/* Active topic filter banner */}
          {view === "active" && topicFilter && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-white/90 drop-shadow">Showing topic:</span>
              <TopicChip tag={topicFilter} active />
              <button
                onClick={() => setTopicFilter(null)}
                className="text-xs text-white/90 hover:text-white underline drop-shadow"
              >
                clear
              </button>
            </div>
          )}

          {/* Add task */}
          {view === "active" && (
            <div className="card p-2 mb-2 flex items-center gap-2 flex-wrap">
              <input
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Add a task…"
                dir="auto"
                className="flex-1 min-w-[200px] text-sm py-1.5 px-2 border border-border rounded-lg"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="text-sm py-1.5 px-2 border border-border rounded-lg"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
              <button onClick={addTask} className="btn btn-primary">
                + Add
              </button>
            </div>
          )}

          {/* Active view */}
          {view === "active" && mode === "oldest" && (
            <div className="card p-0 overflow-hidden">
              {flatSorted.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onPatch={patchTask}
                  onDelete={deleteTask}
                  onEditTags={editTags}
                  onTagClick={setTopicFilter}
                  showCategory
                />
              ))}
              {flatSorted.length === 0 && <EmptyRow />}
            </div>
          )}

          {view === "active" && mode === "category" && (
            <div className="card p-0 overflow-hidden">
              {grouped.map((g) => (
                <div key={g.key}>
                  <SectionHeader
                    color={g.color}
                    icon={g.icon}
                    label={g.label}
                    count={g.items.length}
                  />
                  {g.items.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onPatch={patchTask}
                      onDelete={deleteTask}
                      onEditTags={editTags}
                      onTagClick={setTopicFilter}
                    />
                  ))}
                </div>
              ))}
              {grouped.length === 0 && <EmptyRow />}
            </div>
          )}

          {view === "active" && mode === "topic" && (
            <div className="card p-0 overflow-hidden">
              {topicGroups.map((g) => {
                const isNone = g.tag === "__none";
                const hue = isNone ? 0 : topicHue(g.tag);
                return (
                  <div key={g.tag}>
                    <div
                      className="flex items-center gap-2 px-2.5 py-1.5 border-y border-border"
                      style={{
                        background: isNone
                          ? "#f1f5f9"
                          : `hsl(${hue} 90% 96%)`,
                        borderLeft: isNone
                          ? "3px solid #cbd5e1"
                          : `3px solid hsl(${hue} 70% 55%)`,
                      }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: isNone ? "#64748b" : `hsl(${hue} 65% 32%)` }}
                      >
                        {isNone ? "ללא נושא / No topic" : `# ${g.tag}`}
                      </span>
                      <span className="text-[10px] text-muted ml-auto">
                        {g.items.length}
                      </span>
                    </div>
                    {g.items.map((t) => (
                      <TaskRow
                        key={t.id + g.tag}
                        task={t}
                        onPatch={patchTask}
                        onDelete={deleteTask}
                        onEditTags={editTags}
                        onTagClick={setTopicFilter}
                        showCategory
                      />
                    ))}
                  </div>
                );
              })}
              {topicGroups.length === 0 && <EmptyRow />}
            </div>
          )}

          {/* Archive view */}
          {view === "archive" && (
            <div className="card p-0 overflow-hidden">
              {archived.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 border-b border-border/50 last:border-b-0"
                >
                  <span className="text-success text-sm">✓</span>
                  <span dir="auto" className="flex-1 text-sm text-muted line-through">
                    {t.content}
                  </span>
                  {t.completedAt && (
                    <span className="text-[11px] text-muted whitespace-nowrap">
                      {formatDate(t.completedAt)}
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

          <div className="min-w-0">
            <IdeasPanel />
          </div>
        </div>
      )}

      {/* For Yoav */}
      {mainTab === "yoav" && (
        <>
          <p className="text-xs text-white/85 drop-shadow mb-2">
            Things to raise with Yoav at the Sunday שוטף meeting. Check each off as you cover it.
          </p>
          <div className="card p-2 mb-2 flex items-center gap-2 flex-wrap">
            <input
              value={newYoav}
              onChange={(e) => setNewYoav(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addYoav()}
              placeholder="Add something to discuss…"
              dir="auto"
              className="flex-1 min-w-[200px] text-sm py-1.5 px-2 border border-border rounded-lg"
            />
            <button onClick={addYoav} className="btn btn-primary">
              + Add
            </button>
          </div>

          <div className="card p-0 overflow-hidden mb-3">
            {yoavActive.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 px-2.5 py-1.5 border-b border-border/50 last:border-b-0 hover:bg-gray-50"
              >
                <button
                  onClick={() => patchTask(t.id, { done: true })}
                  title="Mark as covered"
                  className="w-4 h-4 rounded-full border-2 border-border hover:border-success hover:bg-success/10 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-sm font-medium" dir="auto">
                  <InlineText
                    value={t.content}
                    onSave={(val) => patchTask(t.id, { content: val })}
                  />
                </div>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-muted hover:text-danger text-xs flex-shrink-0"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
            {yoavActive.length === 0 && (
              <div className="text-center text-muted py-8 text-sm">
                Nothing to discuss right now. 🎉
              </div>
            )}
          </div>

          {yoavCovered.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-2.5 py-1 bg-gray-100 border-b border-border">
                <h2 className="text-xs font-bold text-muted">
                  Covered ({yoavCovered.length})
                </h2>
              </div>
              {yoavCovered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 border-b border-border/50 last:border-b-0"
                >
                  <span className="text-success text-sm">✓</span>
                  <span dir="auto" className="flex-1 text-sm text-muted line-through">
                    {t.content}
                  </span>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SectionHeader({
  color,
  icon,
  label,
  count,
}: {
  color: string;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 border-y border-border"
      style={{ background: `${color}14`, borderLeft: `3px solid ${color}` }}
    >
      <span className="text-sm leading-none">{icon}</span>
      <h2 className="text-xs font-bold" style={{ color }}>
        {label}
      </h2>
      <span className="text-[10px] text-muted ml-auto">{count}</span>
    </div>
  );
}

function EmptyRow() {
  return (
    <div className="text-center text-muted py-8 text-sm">No open tasks. 🎉</div>
  );
}

function TaskRow({
  task,
  onPatch,
  onDelete,
  onEditTags,
  onTagClick,
  showCategory = false,
}: {
  task: Task;
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onEditTags: (t: Task) => void;
  onTagClick: (tag: string) => void;
  showCategory?: boolean;
}) {
  const d = daysWaiting(task.addedAt);
  const urgent = d >= 14;
  const tags = splitTags(task.tags);
  return (
    <div
      className={`group flex items-start gap-1.5 px-2.5 py-1 border-b border-border/50 last:border-b-0 hover:bg-gray-50 ${
        task.important ? "bg-amber-50/60" : ""
      }`}
    >
      <button
        onClick={() => {
          if (confirm("Mark this task as done?")) onPatch(task.id, { done: true });
        }}
        title="Mark done"
        className="mt-1 w-4 h-4 rounded-full border-2 border-border hover:border-success hover:bg-success/10 flex-shrink-0"
      />
      <button
        onClick={() => onPatch(task.id, { important: !task.important })}
        title={task.important ? "Important" : "Mark important"}
        className={`mt-0.5 text-base leading-none flex-shrink-0 ${
          task.important ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
        }`}
      >
        {task.important ? "★" : "☆"}
      </button>

      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {showCategory && (
          <span
            title={task.category}
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: categoryColor(task.category) }}
          />
        )}
        <span className="text-sm font-medium min-w-0" dir="auto">
          <InlineText
            value={task.content}
            onSave={(val) => onPatch(task.id, { content: val })}
          />
        </span>
        {tags.map((tag) => (
          <TopicChip key={tag} tag={tag} onClick={() => onTagClick(tag)} />
        ))}
      </div>

      <button
        onClick={() => onEditTags(task)}
        title="Edit topics"
        className="mt-0.5 text-xs text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition flex-shrink-0"
      >
        🏷
      </button>
      <span
        className={`mt-0.5 text-[11px] whitespace-nowrap flex-shrink-0 ${
          urgent ? "text-danger font-bold" : "text-muted"
        }`}
        title={`Added ${formatDate(task.addedAt)}`}
      >
        {waitingLabel(task.addedAt)}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="mt-0.5 text-muted hover:text-danger text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}
