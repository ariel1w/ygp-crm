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
  showNow,
}: {
  value: string;
  displayValue?: string;
  placeholder?: string;
  onSave: (val: string) => void;
  showNow?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
    <div ref={containerRef} className="flex items-center gap-1">
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => {
          onSave(e.target.value);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        className="text-sm py-0.5 px-1 -mx-1"
      />
      {showNow && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            onSave(new Date().toISOString());
            setEditing(false);
          }}
          className="btn btn-primary text-xs py-0.5 px-2 whitespace-nowrap"
        >
          Now
        </button>
      )}
    </div>
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

export function InlineMultiSelect({
  value,
  options,
  placeholder,
  onSave,
  max = 2,
  separator = ", ",
}: {
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onSave: (val: string) => void;
  max?: number;
  separator?: string;
}) {
  const values = value ? value.split(separator).filter(Boolean) : [];
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingIndex(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (selected: string, index: number) => {
    const next = [...values];
    if (index < next.length) {
      if (!selected) {
        next.splice(index, 1);
      } else {
        next[index] = selected;
      }
    } else {
      if (selected) next.push(selected);
    }
    onSave(next.join(separator));
    setEditingIndex(null);
    setOpen(next.length === 0 ? false : true);
  };

  const handleRemove = (index: number) => {
    const next = values.filter((_, i) => i !== index);
    onSave(next.join(separator));
    if (next.length === 0) setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); if (values.length === 0) setEditingIndex(0); }}
        className="text-left w-full hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 min-h-[24px] text-sm"
      >
        {values.length > 0 ? (
          values.join(separator)
        ) : (
          <span className="text-muted italic">{placeholder || "—"}</span>
        )}
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap items-center gap-1 px-1 py-0.5 -mx-1 min-h-[24px] text-sm">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 text-xs">
            {editingIndex === i ? (
              <select
                autoFocus
                value={v}
                onChange={(e) => handleSelect(e.target.value, i)}
                onBlur={() => setEditingIndex(null)}
                className="text-xs bg-transparent border-none p-0 outline-none"
              >
                <option value="">Remove</option>
                {options.filter((o) => !values.includes(o.value) || o.value === v).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <>
                <span className="cursor-pointer" onClick={() => setEditingIndex(i)}>{v}</span>
                <button
                  onClick={() => handleRemove(i)}
                  className="text-blue-500 hover:text-blue-700 ml-0.5 leading-none"
                >
                  ×
                </button>
              </>
            )}
          </span>
        ))}
        {values.length < max && editingIndex !== values.length && (
          <button
            onClick={() => setEditingIndex(values.length)}
            className="text-blue-500 hover:text-blue-700 text-sm font-bold leading-none px-1"
          >
            +
          </button>
        )}
        {editingIndex === values.length && values.length < max && (
          <select
            autoFocus
            value=""
            onChange={(e) => handleSelect(e.target.value, values.length)}
            onBlur={() => setEditingIndex(null)}
            className="text-xs py-0.5 px-1"
          >
            <option value="">Select...</option>
            {options.filter((o) => !values.includes(o.value)).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
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
