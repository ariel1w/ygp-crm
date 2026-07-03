"use client";

import { useEffect, useState, useCallback } from "react";
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
}

const UPDATED_OPTIONS = [
  { value: "כן", label: "כן" },
  { value: "עודכן", label: "עודכן" },
  { value: "לא", label: "לא" },
];

export default function ReadingListPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "progress" | "pending">("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const filtered = submissions.filter((s) => {
    if (filter === "progress" && !s.inProgress) return false;
    if (filter === "pending" && s.inProgress) return false;
    if (
      search &&
      !(s.projectName || "").toLowerCase().includes(search.toLowerCase()) &&
      !(s.senderName || "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white drop-shadow">
          Reading List ({filtered.length})
        </h1>
        <Link href="/reading-list/new" className="btn btn-primary">
          + New Submission
        </Link>
      </div>

      <div className="flex gap-3 mb-4 bg-white/90 backdrop-blur rounded-xl p-3">
        <input
          placeholder="Search project or sender..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1 bg-[#f5f3f0] rounded-full p-1">
          <button
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${filter === "all" ? "bg-white text-foreground shadow-sm" : "text-muted"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${filter === "progress" ? "bg-white text-foreground shadow-sm" : "text-muted"}`}
            onClick={() => setFilter("progress")}
          >
            In Progress
          </button>
          <button
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${filter === "pending" ? "bg-white text-foreground shadow-sm" : "text-muted"}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
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
              <th>In Progress</th>
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
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={s.inProgress}
                    onChange={(e) =>
                      patchSubmission(s.id, { inProgress: e.target.checked })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
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
                <td colSpan={10} className="text-center text-muted py-8">
                  No submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
