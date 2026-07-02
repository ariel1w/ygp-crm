"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { TEAM_MEMBERS } from "@/lib/constants";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
}

const QUICK_DATES = [
  { label: "Tomorrow", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
];

export default function QuickLog({
  contact,
  onClose,
  onSaved,
}: {
  contact: Contact;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [author, setAuthor] = useState("");
  const [notes, setNotes] = useState<string[]>([""]);
  const [nextAction, setNextAction] = useState(contact.nextAction || "");
  const [nextActionDate, setNextActionDate] = useState(
    contact.nextActionDate
      ? format(new Date(contact.nextActionDate), "yyyy-MM-dd")
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"log" | "followup-only">("log");

  const setQuickDate = (days: number) => {
    setNextActionDate(format(addDays(new Date(), days), "yyyy-MM-dd"));
  };

  const updateNote = (index: number, value: string) => {
    setNotes((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const addNote = () => {
    setNotes((prev) => [...prev, ""]);
  };

  const removeNote = (index: number) => {
    if (notes.length === 1) return;
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);

    // Save each non-empty note as a separate note entry
    if (mode === "log") {
      const nonEmpty = notes.filter((n) => n.trim());
      for (const content of nonEmpty) {
        await fetch(`/api/contacts/${contact.id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: author || "Shani",
            content,
          }),
        });
      }
    }

    // Always update follow-up info
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nextAction: nextAction || null,
        nextActionDate: nextActionDate || null,
      }),
    });

    setSaving(false);
    onSaved();
  };

  const hasNotes = notes.some((n) => n.trim());

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">{contact.name}</h2>
              {contact.company && (
                <p className="text-sm text-muted">{contact.company}</p>
              )}
            </div>
            <button onClick={onClose} className="text-muted hover:text-foreground text-xl">
              x
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 mb-4 bg-[#f5f3f0] rounded-full p-1">
            <button
              className={`text-sm font-semibold flex-1 py-2 px-3 rounded-full transition-colors ${mode === "log" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              onClick={() => setMode("log")}
            >
              Log Interaction + Follow-Up
            </button>
            <button
              className={`text-sm font-semibold flex-1 py-2 px-3 rounded-full transition-colors ${mode === "followup-only" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              onClick={() => setMode("followup-only")}
            >
              Just Set Follow-Up
            </button>
          </div>

          {mode === "log" && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Who?</label>
                <select value={author} onChange={(e) => setAuthor(e.target.value)}>
                  <option value="">Select...</option>
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Notes</label>
                  <button
                    type="button"
                    onClick={addNote}
                    className="text-xs font-bold text-primary hover:text-primary-hover w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary-light transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2">
                  {notes.map((note, i) => (
                    <div key={i} className="flex gap-2">
                      <textarea
                        rows={2}
                        placeholder={i === 0 ? "Add a note..." : "Another note..."}
                        value={note}
                        onChange={(e) => updateNote(i, e.target.value)}
                        autoFocus={i === 0}
                        className="flex-1"
                      />
                      {notes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeNote(i)}
                          className="text-muted hover:text-danger text-sm self-start mt-2"
                        >
                          x
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Next Action
            </label>
            <input
              placeholder="e.g., Send screener, Follow up on deal, Check in..."
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              autoFocus={mode === "followup-only"}
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">
              Follow-Up Date
            </label>
            <input
              type="date"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_DATES.map((qd) => (
              <button
                key={qd.days}
                type="button"
                onClick={() => setQuickDate(qd.days)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f5f3f0] text-foreground hover:bg-primary hover:text-white transition-colors"
              >
                {qd.label}
              </button>
            ))}
            {nextActionDate && (
              <button
                type="button"
                onClick={() => setNextActionDate("")}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f5f3f0] text-muted hover:bg-muted hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="btn btn-primary flex-1"
              disabled={saving || (mode === "log" && !hasNotes)}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
