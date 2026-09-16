"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { STAGES, STAGE_COLUMNS } from "@/lib/slate-constants";
import ConfirmDialog from "@/components/ConfirmDialog";

export interface MoveSource {
  id: string;
  projectName: string;
  senderName: string | null;
  ygpContact: string | null;
  notes: string;
}

interface SlateRow {
  id: string;
  name: string;
  stage: string;
}

interface Props {
  source: MoveSource;
  onClose: () => void;
  onMoved: (project: { id: string; stage: string }) => void;
}

const MULTI_SEP = ", ";

// The window that carries a reading-list project over to the Central Project
// List. Pre-filled from the reading-list row; the stage picks which fields
// are asked, using the same dropdowns as the list itself.
export default function MoveToSlateDialog({ source, onClose, onMoved }: Props) {
  const [stage, setStage] = useState("development");
  const [values, setValues] = useState<Record<string, string>>(() => ({
    name: source.projectName.trim(),
    creator: source.senderName?.trim() ?? "",
    keyPeople: source.ygpContact?.trim() ?? "",
  }));
  const [slate, setSlate] = useState<SlateRow[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/slate")
      .then((r) => r.json())
      .then((rows: SlateRow[]) => setSlate(rows))
      .catch(() => setSlate([]));
  }, []);

  const name = (values.name ?? "").trim();
  const duplicate = useMemo(() => {
    if (!slate || !name) return null;
    const lower = name.toLowerCase();
    return slate.find((p) => p.name.trim().toLowerCase() === lower) ?? null;
  }, [slate, name]);

  const columns = (STAGE_COLUMNS[stage] || []).filter((c) => c.key !== "name");
  const set = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (error) setError(null);
  };

  const toggleMulti = (key: string, option: string) => {
    const current = (values[key] || "").split(MULTI_SEP).filter(Boolean);
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    set(key, next.join(MULTI_SEP));
  };

  const stageLabel = (key: string) => STAGES.find((s) => s.key === key)?.label ?? key;

  const askToMove = () => {
    if (!name) {
      setError("Give the project a name first.");
      return;
    }
    if (duplicate) return;
    setConfirming(true);
  };

  const move = async () => {
    setConfirming(false);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${source.id}/move-to-slate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, name, stage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not move the project. Please try again.");
        return;
      }
      onMoved({ id: data.id, stage: data.stage });
    } catch {
      setError("Could not move the project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Move to Central Project List"
      >
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-base font-bold text-foreground truncate">
            Move to Central Project List
          </h2>
          <button
            onClick={onClose}
            title="Close"
            className="text-muted hover:text-danger text-lg leading-none flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <label className="col-span-2 text-xs font-semibold text-muted">
            Project
            <input
              dir="auto"
              autoFocus
              value={values.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 w-full text-sm"
            />
          </label>

          {duplicate && (
            <div className="col-span-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
              &ldquo;{duplicate.name}&rdquo; is already in the Central Project List, under{" "}
              {stageLabel(duplicate.stage)}.{" "}
              <Link
                href={`/slate?new=${duplicate.id}&stage=${duplicate.stage}`}
                className="underline"
              >
                Open it
              </Link>{" "}
              or change the name.
            </div>
          )}

          <label className="col-span-2 text-xs font-semibold text-muted">
            Stage
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="mt-1 w-full text-sm"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {columns.map((col) => (
            <label
              key={col.key}
              className={`text-xs font-semibold text-muted ${
                col.type === "multiselect" ? "col-span-2" : ""
              }`}
            >
              {col.label}
              {col.type === "select" && col.options ? (
                <select
                  value={values[col.key] ?? ""}
                  onChange={(e) => set(col.key, e.target.value)}
                  className="mt-1 w-full text-sm"
                >
                  <option value="">—</option>
                  {col.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : col.type === "multiselect" && col.options ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {col.options.map((o) => {
                    const on = (values[col.key] || "")
                      .split(MULTI_SEP)
                      .filter(Boolean)
                      .includes(o);
                    return (
                      <button
                        type="button"
                        key={o}
                        onClick={() => toggleMulti(col.key, o)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                          on
                            ? "bg-foreground text-white border-foreground"
                            : "bg-white text-foreground border-border hover:border-primary"
                        }`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  dir="auto"
                  value={values[col.key] ?? ""}
                  onChange={(e) => set(col.key, e.target.value)}
                  className="mt-1 w-full text-sm"
                />
              )}
            </label>
          ))}

          {source.notes.trim() && (
            <div className="col-span-2 mt-1">
              <div className="text-xs font-semibold text-muted mb-1">
                Reading list notes (for reference, not copied)
              </div>
              <div
                dir="auto"
                className="text-sm whitespace-pre-wrap bg-gray-50 border border-border rounded-lg p-2 max-h-32 overflow-y-auto"
              >
                {source.notes}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-4">
          <span className="text-xs text-muted">
            Moving deletes this row from the reading list.
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={askToMove}
              disabled={submitting || !!duplicate || !name}
              className="btn btn-primary disabled:opacity-50"
            >
              {submitting ? "Moving…" : "Move"}
            </button>
          </div>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Move to the Central Project List?"
          message={`"${name}" will be added to the top of ${stageLabel(
            stage
          )} and deleted from the reading list.`}
          confirmLabel="Move"
          onCancel={() => setConfirming(false)}
          onConfirm={move}
        />
      )}
    </div>
  );
}
