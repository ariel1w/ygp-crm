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
  notes: string;
}

const UPDATED_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const IN_PROGRESS = "__in_progress__";

// Generate weeks for 2026-2027
const ALL_WEEKS = generateWeeks(2026, new Date().getFullYear() + 1);

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
  const [search, setSearch] = useState("");
  const [noteModal, setNoteModal] = useState<{
    id: string;
    projectName: string;
    draft: string;
  } | null>(null);

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

  // Count submissions and not-notified per week (include in-progress since they have a week now)
  const weekCounts = useMemo(() => {
    const counts = new Map<string, { total: number; notNotified: number }>();
    for (const s of submissions) {
      if (!s.week) continue;
      const prev = counts.get(s.week) || { total: 0, notNotified: 0 };
      prev.total++;
      if (s.wasUpdated !== "Yes") {
        prev.notNotified++;
      }
      counts.set(s.week, prev);
    }
    return counts;
  }, [submissions]);

  const inProgressCount = submissions.filter((s) => s.inProgress).length;

  const totalNotNotified = useMemo(() => {
    return submissions.filter(
      (s) => s.wasUpdated !== "Yes"
    ).length;
  }, [submissions]);

  const filtered = useMemo(() => {
    if (activeTab === IN_PROGRESS) {
      return submissions.filter((s) => s.inProgress);
    }
    return submissions.filter((s) => s.week === activeTab);
  }, [submissions, activeTab]);

  // --- Search: matches any field, across every week, from 2+ characters ---
  const query = search.trim().toLowerCase();
  const searching = query.length >= 2;

  const weekLabel = useCallback((key: string | null) => {
    if (!key) return "";
    const w = ALL_WEEKS.find((x) => x.key === key);
    return w ? `${w.label}, ${w.year}` : key;
  }, []);

  const searchResults = useMemo(() => {
    if (!searching) return [];
    return submissions.filter((s) => {
      const haystack = [
        s.projectName,
        s.senderName,
        s.ygpContact,
        s.senderEmail,
        s.status,
        s.updatedBy,
        weekLabel(s.week),
        s.dateReceived
          ? format(new Date(s.dateReceived), "dd/MM/yyyy")
          : "",
        s.inProgress ? "in progress" : "",
        s.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [submissions, query, searching, weekLabel]);

  const rows = searching ? searchResults : filtered;
  const isInProgressTab = !searching && activeTab === IN_PROGRESS;

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
              <span className="ml-1">{inProgressCount}</span>
            )}
          </button>

          {totalNotNotified > 0 && (
            <div className="px-3 py-1.5 mb-2 text-xs font-bold text-danger bg-red-50 rounded-lg">
              Not Notified: {totalNotNotified}
            </div>
          )}

          <div className="border-t border-border my-2" />

          {/* Year/Month/Week tree */}
          {Array.from(grouped.entries()).map(([year, months]) => {
            const yearTotal = Array.from(months.values())
              .flat()
              .reduce((sum, w) => sum + (weekCounts.get(w.key)?.total || 0), 0);
            const yearNotNotified = Array.from(months.values())
              .flat()
              .reduce((sum, w) => sum + (weekCounts.get(w.key)?.notNotified || 0), 0);
            return (
            <div key={year}>
              <button
                onClick={() =>
                  setExpandedYear(expandedYear === year ? -1 : year)
                }
                className="w-full text-left px-3 py-1.5 text-sm font-bold text-foreground hover:bg-gray-100 rounded-lg"
              >
                {expandedYear === year ? "▾" : "▸"} {year}
                {yearTotal > 0 && (
                  <span className="ml-1 text-xs font-normal opacity-60">({yearTotal})</span>
                )}
                {yearNotNotified > 0 && (
                  <span className="ml-1 text-xs font-bold text-danger">({yearNotNotified})</span>
                )}
              </button>

              {expandedYear === year && (
                <div className="ml-2">
                  {Array.from(months.entries()).map(([month, weeks]) => {
                    const monthTotal = weeks.reduce(
                      (sum, w) => sum + (weekCounts.get(w.key)?.total || 0),
                      0
                    );
                    const monthNotNotified = weeks.reduce(
                      (sum, w) => sum + (weekCounts.get(w.key)?.notNotified || 0),
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
                          {monthTotal > 0 && (
                            <span className="ml-1 opacity-60">
                              ({monthTotal})
                            </span>
                          )}
                          {monthNotNotified > 0 && (
                            <span className="ml-1 font-bold text-danger">
                              ({monthNotNotified})
                            </span>
                          )}
                        </button>

                        {expandedMonth === month && (
                          <div className="ml-3">
                            {weeks.map((w) => {
                              const wc = weekCounts.get(w.key);
                              const total = wc?.total || 0;
                              const notNotified = wc?.notNotified || 0;
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
                                  {total > 0 && (
                                    <span className={`ml-1 ${activeTab === w.key ? "opacity-70" : "opacity-60"}`}>
                                      ({total})
                                    </span>
                                  )}
                                  {notNotified > 0 && (
                                    <span className={`ml-1 font-bold ${activeTab === w.key ? "text-white" : "text-danger"}`}>
                                      ({notNotified})
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
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-white drop-shadow">
            {searching
              ? `Search: “${search.trim()}” — ${searchResults.length} found`
              : isInProgressTab
              ? "In Progress"
              : (() => {
                  const w = ALL_WEEKS.find((w) => w.key === activeTab);
                  return w ? `${w.label}, ${w.year}` : "Reading List";
                })()}
          </h1>
          <div className="flex gap-2 items-center">
            {/* Search across every week and every field */}
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all projects…"
                dir="auto"
                className="text-sm py-1.5 ps-8 pe-7 rounded-lg border border-border bg-white w-56"
              />
              <span className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">
                🔍
              </span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  title="Clear search"
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted hover:text-danger text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button onClick={addInlineSubmission} className="btn btn-secondary bg-white">
              + Add Manually
            </button>
            <Link
              href="/reading-list/new"
              className="btn btn-primary"
            >
              + Add With Form
            </Link>
          </div>
        </div>

        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table>
            <thead>
              <tr>
                {searching && <th>Where</th>}
                <th>Project</th>
                <th>Notes</th>
                <th>Sender</th>
                <th>Received</th>
                <th>YGP Contact</th>
                <th>Email / Phone</th>
                <th>Status</th>
                {!isInProgressTab && <th>Notified By</th>}
                {!isInProgressTab && <th>Notified?</th>}
                {!isInProgressTab && <th>In Progress</th>}
                {isInProgressTab && <th></th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  style={{
                    backgroundColor: s.inProgress ? "#ecfdf5" : undefined,
                  }}
                >
                  {searching && (
                    <td className="whitespace-nowrap">
                      <button
                        onClick={() => {
                          setActiveTab(s.inProgress && !s.week ? IN_PROGRESS : s.week!);
                          setSearch("");
                        }}
                        title="Go to this week"
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        {s.inProgress && !s.week
                          ? "In Progress"
                          : weekLabel(s.week) || "—"}
                      </button>
                    </td>
                  )}
                  <td>
                    <InlineText
                      value={s.projectName}
                      placeholder="Project name"
                      onSave={(val) =>
                        patchSubmission(s.id, { projectName: val })
                      }
                    />
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() =>
                        setNoteModal({
                          id: s.id,
                          projectName: s.projectName,
                          draft: s.notes || "",
                        })
                      }
                      title={s.notes ? s.notes : "Add note"}
                      className={`rounded px-1 py-0.5 text-sm transition-opacity ${
                        s.notes
                          ? "hover:bg-blue-50"
                          : "opacity-0 hover:opacity-50"
                      }`}
                    >
                      {s.notes ? "📝" : "➕"}
                    </button>
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
                  {!isInProgressTab && (
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
                  )}
                  {!isInProgressTab && (
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
                  )}
                  {!isInProgressTab && (
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={s.inProgress}
                        onChange={() => {
                          if (s.inProgress) {
                            alert("To remove from In Progress, go to the In Progress tab.");
                          } else {
                            patchSubmission(s.id, { inProgress: true });
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  {isInProgressTab && (
                    <td>
                      <button
                        onClick={() => {
                          if (confirm("Remove this project from In Progress?")) {
                            patchSubmission(s.id, { inProgress: false });
                          }
                        }}
                        className="text-xs text-muted hover:text-danger"
                      >
                        Remove
                      </button>
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
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={(isInProgressTab ? 8 : 11) + (searching ? 1 : 0)}
                    className="text-center text-muted py-8"
                  >
                    {searching ? (
                      <>
                        Nothing matches “{search.trim()}”. Try fewer letters, or
                        a sender / project / status.
                      </>
                    ) : (
                      <>
                        No submissions in this week.{" "}
                        <button
                          onClick={addInlineSubmission}
                          className="text-primary hover:underline"
                        >
                          Add one
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes popup */}
      {noteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setNoteModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4"
            onClick={(e) => e.stopPropagation()}
            dir="auto"
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-base font-bold text-foreground truncate">
                Notes{noteModal.projectName ? `: ${noteModal.projectName}` : ""}
              </h2>
              <button
                onClick={() => setNoteModal(null)}
                title="Close"
                className="text-muted hover:text-danger text-lg leading-none flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <textarea
              autoFocus
              value={noteModal.draft}
              onChange={(e) =>
                setNoteModal({ ...noteModal, draft: e.target.value })
              }
              placeholder="Write a note about this project…"
              dir="auto"
              rows={6}
              className="w-full text-sm p-2 border border-border rounded-lg resize-y"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setNoteModal(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  patchSubmission(noteModal.id, { notes: noteModal.draft });
                  setNoteModal(null);
                }}
                className="btn btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
