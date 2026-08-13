"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export function InlineText({
  value,
  placeholder,
  onSave,
  clampLines,
  onExpand,
}: {
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
  /** Wrap the text but show at most this many lines, cutting the rest off. */
  clampLines?: number;
  /** When the text is cut off, clicking calls this instead of editing inline. */
  onExpand?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [clipped, setClipped] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const displayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Does the value actually overflow the clamp? Re-measured on resize, since
  // the column width changes with the window.
  useEffect(() => {
    if (!clampLines || editing) return;
    const el = displayRef.current;
    if (!el) return;
    const measure = () => setClipped(el.scrollHeight - el.clientHeight > 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [clampLines, editing, value]);

  if (!editing) {
    const expandable = clipped && !!onExpand;
    return (
      <button
        ref={displayRef}
        onClick={() => (expandable ? onExpand!() : setEditing(true))}
        title={expandable ? "Click to read and edit the full text" : undefined}
        className="text-left w-full hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 min-h-[24px] text-sm"
        style={
          clampLines
            ? {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: clampLines,
                overflow: "hidden",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }
            : undefined
        }
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

/** Where the picker panel should sit on screen, in viewport coordinates. */
type PanelPos = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

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
  const [search, setSearch] = useState("");
  // Ticks live here while the panel is open, so several picks are one save.
  const [draft, setDraft] = useState<string[]>([]);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedIds = selected.map((s) => s.project.id);
  const savedKey = [...selectedIds].sort().join(",");

  const openPanel = () => {
    setDraft(selectedIds);
    setSearch("");
    setOpen(true);
  };

  // Closing is what saves. Only fires when the ticks actually changed.
  const closePanel = () => {
    setOpen(false);
    if ([...draft].sort().join(",") !== savedKey) onSave(draft);
  };

  // The panel is rendered on document.body, so the table's overflow box can
  // never clip it. That means placing it by hand, and again on scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const margin = 8;
      const width = Math.min(Math.max(r.width, 260), 340);
      const below = window.innerHeight - r.bottom - margin;
      const above = r.top - margin;
      const flip = below < 240 && above > below;
      setPos({
        left: Math.min(
          Math.max(margin, r.left),
          window.innerWidth - width - margin
        ),
        width,
        maxHeight: Math.min(360, flip ? above : below),
        ...(flip
          ? { bottom: window.innerHeight - r.top + 4 }
          : { top: r.bottom + 4 }),
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      closePanel();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  });

  const toggle = (id: string) =>
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  // With the panel open the draft is the source of truth, so untick there
  // instead, otherwise the save on close would put the project straight back.
  const remove = (id: string) =>
    open ? toggle(id) : onSave(selectedIds.filter((x) => x !== id));

  const q = search.trim().toLowerCase();
  const matches = allProjects.filter((p) => p.name.toLowerCase().includes(q));
  const picked = matches.filter((p) => draft.includes(p.id));
  const rest = matches.filter((p) => !draft.includes(p.id));

  const row = (p: { id: string; name: string }) => (
    <label
      key={p.id}
      className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--primary-light)] rounded cursor-pointer text-sm"
    >
      <input
        type="checkbox"
        checked={draft.includes(p.id)}
        onChange={() => toggle(p.id)}
        className="w-3.5 h-3.5 shrink-0"
      />
      <span className="truncate">{p.name}</span>
    </label>
  );

  return (
    <>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? closePanel() : openPanel();
          }
        }}
        className="text-left w-full hover:bg-[var(--primary-light)] rounded px-1 py-0.5 -mx-1 min-h-[24px] text-sm cursor-pointer"
      >
        {selected.length > 0 ? (
          <span className="flex flex-wrap items-center gap-1">
            {selected.slice(0, 2).map((s) => (
              <span
                key={s.project.id}
                className="badge badge-type group gap-1 max-w-[150px]"
              >
                <span className="truncate">{s.project.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(s.project.id);
                  }}
                  title={`Remove ${s.project.name}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
            {selected.length > 2 && (
              <span className="text-xs text-muted">+{selected.length - 2}</span>
            )}
          </span>
        ) : (
          <span className="text-muted italic">No projects</span>
        )}
      </div>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
            className="fixed z-50 flex flex-col bg-card border border-border rounded-md shadow-lg"
          >
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="m-2 mb-1 text-sm"
            />
            <div className="overflow-y-auto p-1 pt-0">
              {picked.map(row)}
              {picked.length > 0 && rest.length > 0 && (
                <div className="border-t border-border my-1" />
              )}
              {rest.map(row)}
              {matches.length === 0 && (
                <div className="text-center text-muted text-sm py-4">
                  No project matches &ldquo;{search}&rdquo;
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
