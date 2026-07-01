"use client";

import { useState, useRef, useEffect } from "react";

export function InlineText({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-left w-full hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 min-h-[24px] text-sm"
      >
        {value || <span className="text-muted italic">{placeholder || "—"}</span>}
      </button>
    );
  }

  return (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft !== value) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(false);
          if (draft !== value) onSave(draft);
        }
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className="text-sm py-0.5 px-1 -mx-1 w-full"
    />
  );
}

export function InlineTextArea({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-left w-full hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 min-h-[24px] text-sm whitespace-pre-wrap"
      >
        {value || <span className="text-muted italic">{placeholder || "—"}</span>}
      </button>
    );
  }

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }}
      onBlur={() => {
        setEditing(false);
        if (draft !== value) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className="text-sm py-0.5 px-1 -mx-1 w-full resize-none overflow-hidden"
      rows={2}
    />
  );
}

export function InlineDate({
  value,
  displayValue,
  placeholder,
  onSave,
}: {
  value: string;
  displayValue?: string;
  placeholder?: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-left w-full hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 min-h-[24px] text-sm whitespace-nowrap"
      >
        {displayValue || value || <span className="text-muted italic">{placeholder || "Set date"}</span>}
      </button>
    );
  }

  return (
    <input
      ref={ref}
      type="date"
      value={value}
      onChange={(e) => {
        onSave(e.target.value);
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditing(false);
      }}
      className="text-sm py-0.5 px-1 -mx-1"
    />
  );
}

export function InlineSelect({
  value,
  options,
  placeholder,
  onSave,
}: {
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const display = options.find((o) => o.value === value)?.label || value;

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-left w-full hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 min-h-[24px] text-sm"
      >
        {value ? display : <span className="text-muted italic">{placeholder || "—"}</span>}
      </button>
    );
  }

  return (
    <select
      ref={ref}
      value={value}
      onChange={(e) => {
        onSave(e.target.value);
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
      className="text-sm py-0.5 px-1 -mx-1"
    >
      <option value="">None</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function InlineProjects({
  selected,
  allProjects,
  onSave,
}: {
  selected: { project: { id: string; name: string } }[];
  allProjects: { id: string; name: string }[];
  onSave: (projectIds: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedIds = selected.map((s) => s.project.id);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    onSave(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-left w-full hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 min-h-[24px] text-sm"
      >
        {selected.length > 0 ? (
          <span className="truncate block max-w-[180px]">
            {selected.map((s) => s.project.name).join(", ")}
          </span>
        ) : (
          <span className="text-muted italic">No projects</span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-border rounded-md shadow-lg p-2 min-w-[200px] max-h-[300px] overflow-y-auto">
          {allProjects.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="w-3.5 h-3.5"
              />
              {p.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
