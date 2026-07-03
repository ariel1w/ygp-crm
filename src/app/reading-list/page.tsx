"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { TEAM_MEMBERS } from "@/lib/constants";
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

const IN_PROGRESS_TAB = "פרויקטים בהתקדמות";

export default function ReadingListPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(IN_PROGRESS_TAB);
  const [newWeekName, setNewWeekName] = useState("");
  const [showNewWeek, setShowNewWeek] = useState(false);

  const loadData = useCallback(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data: Submission[]) => {
        setSubmissions(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get all unique weeks + in progress tab
  const tabs = useMemo(() => {
    const weeks = new Set<string>();
    for (const s of submissions) {
      if (s.inProgress) continue;
      if (s.week) weeks.add(s.week);
    }
    // Sort weeks (most recent first based on the date pattern)
    const sorted = Array.from(weeks).sort((a, b) => {
      // Try to parse first date from the week name
      const getDate = (w: string) => {
        const m = w.match(/(\d{1,2})[./](\d{1,2})/);
        if (!m) return 0;
        return parseInt(m[2]) * 100 + parseInt(m[1]);
      };
      return getDate(b) - getDate(a);
    });
    return [IN_PROGRESS_TAB, ...sorted];
  }, [submissions]);

  // Set initial active tab to most recent week if no in-progress items
  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  const filtered = useMemo(() => {
    if (activeTab === IN_PROGRESS_TAB) {
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
    const isProgress = activeTab === IN_PROGRESS_TAB;
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

  const addNewWeek = () => {
    if (!newWeekName.trim()) return;
    setActiveTab(newWeekName.trim());
    setShowNewWeek(false);
    setNewWeekName("");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white drop-shadow">
          Reading List
        </h1>
        <div className="flex gap-2">
          <button onClick={addInlineSubmission} className="btn btn-primary">
            + Add Row
          </button>
          <Link href="/reading-list/new" className="btn btn-secondary bg-white">
            + Full Form
          </Link>
        </div>
      </div>

      {/* Week tabs */}
      <div className="flex items-center gap-1 mb-4 bg-white/90 backdrop-blur rounded-xl p-2 overflow-x-auto">
        {tabs.map((tab) => {
          const count =
            tab === IN_PROGRESS_TAB
              ? submissions.filter((s) => s.inProgress).length
              : submissions.filter((s) => s.week === tab && !s.inProgress).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-foreground text-white"
                  : "text-muted hover:text-foreground hover:bg-gray-100"
              }`}
            >
              {tab === IN_PROGRESS_TAB ? "בהתקדמות" : tab}
              <span className="ml-1 opacity-60">({count})</span>
            </button>
          );
        })}
        {showNewWeek ? (
          <div className="flex items-center gap-1">
            <input
              value={newWeekName}
              onChange={(e) => setNewWeekName(e.target.value)}
              placeholder="e.g. 03.07-09.07"
              className="text-xs py-1 px-2 w-28"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") addNewWeek();
                if (e.key === "Escape") setShowNewWeek(false);
              }}
            />
            <button
              onClick={addNewWeek}
              className="text-xs font-bold text-primary"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewWeek(true)}
            className="px-2 py-1.5 text-xs font-bold text-primary hover:bg-primary-light rounded-full transition-colors"
          >
            + Week
          </button>
        )}
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
              {activeTab !== IN_PROGRESS_TAB && <th>In Progress</th>}
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
                {activeTab !== IN_PROGRESS_TAB && (
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
                  colSpan={activeTab !== IN_PROGRESS_TAB ? 10 : 9}
                  className="text-center text-muted py-8"
                >
                  No submissions in this tab.{" "}
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
  );
}
