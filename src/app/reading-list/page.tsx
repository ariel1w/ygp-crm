"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { TEAM_MEMBERS } from "@/lib/constants";
import { generateWeeks, getMonthName, type WeekInfo } from "@/lib/weeks";
import { InlineText, InlineDate, InlineSelect } from "@/components/InlineEdit";

interface Submission {
  id: string;
  projectName: string;
  senderName: string | null;
  dateReceived: string | null;
  ygpContact: string | null;
  senderEmail: string | null;
  status: string | null;
  updatedBy: string | null;
  wasUpdated: string | null;
  inProgress: boolean;
  week: string | null;
}

const UPDATED_OPTIONS = [
  { value: "כן", label: "כן" },
  { value: "עודכן", label: "עודכן" },
  { value: "לא", label: "לא" },
];

const IN_PROGRESS = "__in_progress__";

// Generate weeks for 2026-2027
const ALL_WEEKS = generateWeeks(2026, 2027);

// Find the current week
function getCurrentWeekKey(): string {
  const now = new Date();
  for (const w of ALL_WEEKS) {
    if (now >= w.start && now <= w.end) return w.key;
  }
  return ALL_WEEKS[0].key;
}

// Group weeks by year and month
function groupWeeks(weeks: WeekInfo[]): Map<number, Map<number, WeekInfo[]>> {
  const grouped = new Map<number, Map<number, WeekInfo[]>>();
  for (const w of weeks) {
    if (!grouped.has(w.year)) grouped.set(w.year, new Map());
    const yearMap = grouped.get(w.year)!;
    if (!yearMap.has(w.month)) yearMap.set(w.month, []);
    yearMap.get(w.month)!.push(w);
  }
  return grouped;
}

export default function ReadingListPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(IN_PROGRESS);
  const [expandedYear, setExpandedYear] = useState<number>(2026);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const currentWeekKey = useMemo(() => getCurrentWeekKey(), []);
  const grouped = useMemo(() => groupWeeks(ALL_WEEKS), []);

  // Find which month the current week is in and expand it
  useEffect(() => {
    const currentWeek = ALL_WEEKS.find((w) => w.key === currentWeekKey);
    if (currentWeek) {
      setExpandedYear(currentWeek.year);
      setExpandedMonth(currentWeek.month);
    }
  }, [currentWeekKey]);

  const loadData = useCallback(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Count submissions per week
  const weekCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of submissions) {
      if (s.inProgress) continue;
      if (s.week) counts.set(s.week, (counts.get(s.week) || 0) + 1);
    }
    return counts;
  }, [submissions]);

  const inProgressCount = submissions.filter((s) => s.inProgress).length;

  const filtered = useMemo(() => {
    if (activeTab === IN_PROGRESS) {
      return submissions.filter((s) => s.inProgress);
    }
    return submissions.filter((s) => s.week === activeTab && !s.inProgress);
  }, [submissions, activeTab]);

  const patchSubmission = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
      );
    },
    []
  );

  const deleteSubmission = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    await fetch(`/api/submissions/${id}`, { method: "DELETE" });
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  };

  const addInlineSubmission = async () => {
    const isProgress = activeTab === IN_PROGRESS;
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName: "",
        week: isProgress ? null : activeTab,
        inProgress: isProgress,
        dateReceived: new Date().toISOString(),
      }),
    });
    const created = await res.json();
    setSubmissions((prev) => [created, ...prev]);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="flex gap-4">
      {/* Sidebar with year/month/week navigation */}
      <div className="w-56 flex-shrink-0">
        <div className="card p-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {/* In Progress button */}
          <button
            onClick={() => setActiveTab(IN_PROGRESS)}
            className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg mb-2 transition-colors ${
              activeTab === IN_PROGRESS
                ? "bg-foreground text-white"
                : "text-foreground hover:bg-gray-100"
            }`}
          >
            In Progress
            {inProgressCount > 0 && (
              <span className="ml-1 opacity-60">({inProgressCount})</span>
            )}
          </button>

          <div className="border-t border-border my-2" />

          {/* Year/Month/Week tree */}
          {Array.from(grouped.entries()).map(([year, months]) => (
            <div key={year}>
              <button
                onClick={() =>
                  setExpandedYear(expandedYear === year ? -1 : year)
                }
                className="w-full text-left px-3 py-1.5 text-sm font-bold text-foreground hover:bg-gray-100 rounded-lg"
              >
                {expandedYear === year ? "▾" : "▸"} {year}
              </button>

              {expandedYear === year && (
                <div className="ml-2">
                  {Array.from(months.entries()).map(([month, weeks]) => {
                    const monthCount = weeks.reduce(
                      (sum, w) => sum + (weekCounts.get(w.key) || 0),
                      0
                    );
                    return (
                      <div key={month}>
                        <button
                          onClick={() =>
                            setExpandedMonth(
                              expandedMonth === month ? null : month
                            )
                          }
                          className="w-full text-left px-2 py-1 text-xs font-semibold text-muted hover:text-foreground hover:bg-gray-50 rounded"
                        >
                          {expandedMonth === month ? "▾" : "▸"}{" "}
                          {getMonthName(month)}
                          {monthCount > 0 && (
                            <span className="ml-1 opacity-60">
                              ({monthCount})
                            </span>
                          )}
                        </button>

                        {expandedMonth === month && (
                          <div className="ml-3">
                            {weeks.map((w) => {
                              const count = weekCounts.get(w.key) || 0;
                              const isCurrent = w.key === currentWeekKey;
                              return (
                                <button
                                  key={w.key}
                                  onClick={() => setActiveTab(w.key)}
                                  className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                                    activeTab === w.key
                                      ? "bg-primary text-white font-bold"
                                      : isCurrent
                                      ? "text-primary font-semibold hover:bg-primary-light"
                                      : "text-muted hover:text-foreground hover:bg-gray-50"
                                  }`}
                                >
                                  {w.label}
                                  {isCurrent && activeTab !== w.key && " ●"}
                                  {count > 0 && (
                                    <span className="ml-1 opacity-60">
                                      ({count})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white drop-shadow">
            {activeTab === IN_PROGRESS
              ? "In Progress"
              : ALL_WEEKS.find((w) => w.key === activeTab)?.label || activeTab}
            <span className="ml-2 text-sm font-normal opacity-70">
              ({filtered.length})
            </span>
          </h1>
          <div className="flex gap-2">
            <button onClick={addInlineSubmission} className="btn btn-primary">
              + Add Row
            </button>
            <Link
              href="/reading-list/new"
              className="btn btn-secondary bg-white"
            >
              + Full Form
            </Link>
          </div>
        </div>

        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Sender</th>
                <th>Received</th>
                <th>YGP Contact</th>
                <th>Email / Phone</th>
                <th>Status</th>
                <th>Updated By</th>
                <th>Updated?</th>
                {activeTab !== IN_PROGRESS && <th>In Progress</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  style={{
                    backgroundColor: s.inProgress ? "#ecfdf5" : undefined,
                  }}
                >
                  <td>
                    <InlineText
                      value={s.projectName}
                      placeholder="Project name"
                      onSave={(val) =>
                        patchSubmission(s.id, { projectName: val })
                      }
                    />
                  </td>
                  <td>
                    <InlineText
                      value={s.senderName || ""}
                      placeholder="Sender"
                      onSave={(val) =>
                        patchSubmission(s.id, { senderName: val })
                      }
                    />
                  </td>
                  <td>
                    <InlineDate
                      value={
                        s.dateReceived
                          ? format(new Date(s.dateReceived), "yyyy-MM-dd")
                          : ""
                      }
                      displayValue={
                        s.dateReceived
                          ? format(new Date(s.dateReceived), "dd/MM")
                          : ""
                      }
                      placeholder="Date"
                      onSave={(val) =>
                        patchSubmission(s.id, { dateReceived: val })
                      }
                    />
                  </td>
                  <td>
                    <InlineSelect
                      value={s.ygpContact || ""}
                      options={TEAM_MEMBERS.map((m) => ({
                        value: m,
                        label: m,
                      }))}
                      placeholder="Who?"
                      onSave={(val) =>
                        patchSubmission(s.id, { ygpContact: val })
                      }
                    />
                  </td>
                  <td>
                    <InlineText
                      value={s.senderEmail || ""}
                      placeholder="Email/Phone"
                      onSave={(val) =>
                        patchSubmission(s.id, { senderEmail: val })
                      }
                    />
                  </td>
                  <td>
                    <InlineText
                      value={s.status || ""}
                      placeholder="Status"
                      onSave={(val) => patchSubmission(s.id, { status: val })}
                    />
                  </td>
                  <td>
                    <InlineSelect
                      value={s.updatedBy || ""}
                      options={TEAM_MEMBERS.map((m) => ({
                        value: m,
                        label: m,
                      }))}
                      placeholder="Who?"
                      onSave={(val) =>
                        patchSubmission(s.id, { updatedBy: val })
                      }
                    />
                  </td>
                  <td>
                    <InlineSelect
                      value={s.wasUpdated || ""}
                      options={UPDATED_OPTIONS}
                      placeholder="—"
                      onSave={(val) =>
                        patchSubmission(s.id, { wasUpdated: val })
                      }
                    />
                  </td>
                  {activeTab !== IN_PROGRESS && (
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={s.inProgress}
                        onChange={(e) =>
                          patchSubmission(s.id, {
                            inProgress: e.target.checked,
                          })
                        }
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  <td>
                    <button
                      onClick={() => deleteSubmission(s.id)}
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
                    colSpan={activeTab !== IN_PROGRESS ? 10 : 9}
                    className="text-center text-muted py-8"
                  >
                    No submissions in this week.{" "}
                    <button
                      onClick={addInlineSubmission}
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
    </div>
  );
}
