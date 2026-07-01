"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { COMPANY_TYPES, TEAM_MEMBERS } from "@/lib/constants";
import { getContactStatus, type ContactStatus } from "@/lib/status";
import { InlineText, InlineTextArea, InlineDate, InlineSelect, InlineProjects } from "@/components/InlineEdit";
import QuickLog from "@/components/QuickLog";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  companyType: string | null;
  owner: string | null;
  lastContactDate: string | null;
  lastContactBy: string | null;
  lastInteraction: string | null;
  lastAction: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  projects: { project: { id: string; name: string } }[];
}

interface Project {
  id: string;
  name: string;
}

const STATUS_OPTIONS: { value: ContactStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "overdue", label: "Overdue" },
  { value: "due-soon", label: "Due Soon" },
  { value: "needs-attention", label: "Needs Attention" },
  { value: "cold", label: "Going Cold" },
  { value: "active", label: "Active" },
  { value: "new", label: "New / Unworked" },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "">("");
  const [quickLogContact, setQuickLogContact] = useState<Contact | null>(null);
  const [sortCol, setSortCol] = useState<string>("lastContact");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const loadData = useCallback(() => {
    Promise.all([
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([c, p]) => {
      setContacts(c);
      setProjects(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Optimistic inline update: patch the server, then update local state
  const patchContact = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
    },
    []
  );

  const filtered = useMemo(() => {
    const list = contacts.filter((c) => {
      if (
        search &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !(c.company || "").toLowerCase().includes(search.toLowerCase()) &&
        !(c.email || "").toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (typeFilter && c.companyType !== typeFilter) return false;
      if (ownerFilter && c.owner !== ownerFilter) return false;
      if (
        projectFilter &&
        !c.projects.some((p) => p.project.name === projectFilter)
      )
        return false;
      if (statusFilter && getContactStatus(c).status !== statusFilter)
        return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortCol) {
        case "status":
          av = getContactStatus(a).priority;
          bv = getContactStatus(b).priority;
          break;
        case "name":
          av = (a.name || "").toLowerCase();
          bv = (b.name || "").toLowerCase();
          break;
        case "company":
          av = (a.company || "").toLowerCase();
          bv = (b.company || "").toLowerCase();
          break;
        case "projects":
          av = a.projects.map((p) => p.project.name).join(", ").toLowerCase();
          bv = b.projects.map((p) => p.project.name).join(", ").toLowerCase();
          break;
        case "lastContactBy":
          av = (a.lastContactBy || "").toLowerCase();
          bv = (b.lastContactBy || "").toLowerCase();
          break;
        case "lastContact":
          av = a.lastContactDate || "";
          bv = b.lastContactDate || "";
          break;
        case "lastAction":
          av = (a.lastAction || "").toLowerCase();
          bv = (b.lastAction || "").toLowerCase();
          break;
        case "nextAction":
          av = (a.nextAction || "").toLowerCase();
          bv = (b.nextAction || "").toLowerCase();
          break;
        case "followUp":
          av = a.nextActionDate || "";
          bv = b.nextActionDate || "";
          break;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return list;
  }, [contacts, search, typeFilter, ownerFilter, projectFilter, statusFilter, sortCol, sortDir]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white drop-shadow">Contacts ({filtered.length})</h1>
        <Link href="/contacts/new" className="btn btn-primary">
          + New Contact
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 bg-white/90 backdrop-blur rounded-xl p-3">
        <input
          placeholder="Search name, company, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-2 md:col-span-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContactStatus | "")}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {COMPANY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
          <option value="">All Owners</option>
          {TEAM_MEMBERS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {(search || typeFilter || ownerFilter || projectFilter || statusFilter) && (
        <button
          className="btn btn-secondary text-xs mb-4"
          onClick={() => {
            setSearch("");
            setTypeFilter("");
            setOwnerFilter("");
            setProjectFilter("");
            setStatusFilter("");
          }}
        >
          Clear All Filters
        </button>
      )}

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table>
          <thead>
            <tr>
              <SortTh col="status" label="Status" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortTh col="name" label="Name" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortTh col="company" label="Company" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortTh col="projects" label="Projects" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortTh col="lastContactBy" label="Last Contact By" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortTh col="lastContact" label="Last Contact" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortTh col="lastAction" label="Last Action" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortTh col="nextAction" label="Next Action" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <SortTh col="followUp" label="Follow-Up Date" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
              <th className="sticky right-0 bg-[#faf8f6] z-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const si = getContactStatus(c);
              return (
                <tr key={c.id} style={{ backgroundColor: si.bgColor }}>
                  <td>
                    <span
                      className="badge text-xs"
                      style={{ backgroundColor: si.bgColor, color: si.color }}
                    >
                      {si.label}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/contacts/${c.id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td>
                    <InlineText
                      value={c.company || ""}
                      placeholder="Add company"
                      onSave={(val) => patchContact(c.id, { company: val })}
                    />
                  </td>
                  <td>
                    <InlineProjects
                      selected={c.projects}
                      allProjects={projects}
                      onSave={(projectIds) =>
                        patchContact(c.id, { projectIds })
                      }
                    />
                  </td>
                  <td>
                    <InlineSelect
                      value={c.lastContactBy || ""}
                      options={TEAM_MEMBERS.map((m) => ({ value: m, label: m }))}
                      placeholder="Who?"
                      onSave={(val) => patchContact(c.id, { lastContactBy: val })}
                    />
                  </td>
                  <td>
                    <InlineDate
                      value={
                        c.lastContactDate
                          ? format(new Date(c.lastContactDate), "yyyy-MM-dd")
                          : ""
                      }
                      displayValue={
                        c.lastContactDate
                          ? formatDistanceToNow(new Date(c.lastContactDate), {
                              addSuffix: true,
                            })
                          : ""
                      }
                      placeholder="Set date"
                      onSave={(val) =>
                        patchContact(c.id, { lastContactDate: val })
                      }
                    />
                  </td>
                  <td className="min-w-[250px]">
                    <InlineTextArea
                      value={c.lastAction || ""}
                      placeholder="Set last action"
                      onSave={(val) => patchContact(c.id, { lastAction: val })}
                    />
                  </td>
                  <td className="min-w-[250px]">
                    <InlineTextArea
                      value={c.nextAction || ""}
                      placeholder="Set next action"
                      onSave={(val) => patchContact(c.id, { nextAction: val })}
                    />
                  </td>
                  <td>
                    <InlineDate
                      value={
                        c.nextActionDate
                          ? format(new Date(c.nextActionDate), "yyyy-MM-dd")
                          : ""
                      }
                      displayValue={
                        c.nextActionDate
                          ? format(new Date(c.nextActionDate), "MMM d")
                          : ""
                      }
                      placeholder="Set date"
                      onSave={(val) =>
                        patchContact(c.id, { nextActionDate: val })
                      }
                    />
                  </td>
                  <td className="sticky right-0 z-10" style={{ backgroundColor: si.bgColor }}>
                    <button
                      onClick={() => setQuickLogContact(c)}
                      className="btn btn-secondary text-xs py-1 px-2 whitespace-nowrap"
                    >
                      Log
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-muted py-8">
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {quickLogContact && (
        <QuickLog
          contact={quickLogContact}
          onClose={() => setQuickLogContact(null)}
          onSaved={() => {
            setQuickLogContact(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function SortTh({
  col,
  label,
  sortCol,
  sortDir,
  onSort,
}: {
  col: string;
  label: string;
  sortCol: string;
  sortDir: "asc" | "desc";
  onSort: (col: string) => void;
}) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="cursor-pointer select-none hover:text-foreground"
    >
      {label} {active ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : ""}
    </th>
  );
}
