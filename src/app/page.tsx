"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { getContactStatus, type StatusInfo } from "@/lib/status";
import { TEAM_MEMBERS } from "@/lib/constants";
import QuickLog from "@/components/QuickLog";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  companyType: string | null;
  owner: string | null;
  lastContactDate: string | null;
  lastInteraction: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  projects: { project: { id: string; name: string } }[];
}

type ContactWithStatus = Contact & { statusInfo: StatusInfo };

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [quickLogContact, setQuickLogContact] = useState<Contact | null>(null);

  const loadContacts = () => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then(setContacts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const enriched = useMemo(() => {
    return contacts
      .filter((c) => !ownerFilter || c.owner === ownerFilter)
      .map((c) => ({
        ...c,
        statusInfo: getContactStatus(c),
      }));
  }, [contacts, ownerFilter]);

  const overdue = enriched.filter((c) => c.statusInfo.status === "overdue");
  const dueSoon = enriched.filter((c) => c.statusInfo.status === "due-soon");
  const needsAttention = enriched.filter(
    (c) => c.statusInfo.status === "needs-attention"
  );
  const cold = enriched.filter((c) => c.statusInfo.status === "cold");
  const newContacts = enriched.filter((c) => c.statusInfo.status === "new");
  const active = enriched.filter((c) => c.statusInfo.status === "active");

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-sm"
          >
            <option value="">All team members</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}&apos;s contacts
              </option>
            ))}
          </select>
          <Link href="/contacts/new" className="btn btn-primary">
            + New Contact
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <SummaryCard label="Overdue" count={overdue.length} color="#ef4444" />
        <SummaryCard label="Due This Week" count={dueSoon.length} color="#f59e0b" />
        <SummaryCard label="Needs Attention" count={needsAttention.length} color="#f04e5e" />
        <SummaryCard label="Going Cold" count={cold.length} color="#8c8c8c" />
        <SummaryCard label="Active" count={active.length} color="#10b981" />
        <SummaryCard label="New / Unworked" count={newContacts.length} color="#7c5cfc" />
      </div>

      {/* Sections in priority order */}
      {overdue.length > 0 && (
        <DashboardSection
          title="Overdue"
          titleColor="#ef4444"
          contacts={overdue}
          onQuickLog={setQuickLogContact}
        />
      )}

      {dueSoon.length > 0 && (
        <DashboardSection
          title="Due This Week"
          titleColor="#f59e0b"
          contacts={dueSoon}
          onQuickLog={setQuickLogContact}
        />
      )}

      {needsAttention.length > 0 && (
        <DashboardSection
          title="Needs Attention"
          subtitle="Last contact 21-60 days ago, no follow-up set"
          titleColor="#f04e5e"
          contacts={needsAttention}
          onQuickLog={setQuickLogContact}
        />
      )}

      {cold.length > 0 && (
        <DashboardSection
          title="Going Cold"
          subtitle="No contact in 60+ days"
          titleColor="#8c8c8c"
          contacts={cold}
          onQuickLog={setQuickLogContact}
          defaultCollapsed
        />
      )}

      {newContacts.length > 0 && (
        <DashboardSection
          title="New / Unworked"
          subtitle="No interaction logged yet"
          titleColor="#7c5cfc"
          contacts={newContacts}
          onQuickLog={setQuickLogContact}
          defaultCollapsed
        />
      )}

      {quickLogContact && (
        <QuickLog
          contact={quickLogContact}
          onClose={() => setQuickLogContact(null)}
          onSaved={() => {
            setQuickLogContact(null);
            loadContacts();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="card text-center">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: count > 0 ? color : undefined }}>
        {count}
      </p>
    </div>
  );
}

function DashboardSection({
  title,
  subtitle,
  titleColor,
  contacts,
  onQuickLog,
  defaultCollapsed = false,
}: {
  title: string;
  subtitle?: string;
  titleColor: string;
  contacts: ContactWithStatus[];
  onQuickLog: (c: Contact) => void;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 mb-3 w-full text-left"
      >
        <span className="text-xs text-muted">{collapsed ? "+" : "-"}</span>
        <h2 className="text-lg font-semibold" style={{ color: titleColor }}>
          {title} ({contacts.length})
        </h2>
        {subtitle && <span className="text-xs text-muted">— {subtitle}</span>}
      </button>
      {!collapsed && (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Last Contact</th>
                <th>Last Interaction</th>
                <th>Next Action</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      href={`/contacts/${c.id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="text-muted">{c.company || "—"}</td>
                  <td className="whitespace-nowrap">
                    {c.lastContactDate
                      ? formatDistanceToNow(new Date(c.lastContactDate), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </td>
                  <td className="max-w-[250px] truncate text-sm">
                    {c.lastInteraction || "—"}
                  </td>
                  <td className="max-w-[200px] truncate">
                    {c.nextAction || "—"}
                  </td>
                  <td className="whitespace-nowrap">
                    {c.nextActionDate
                      ? format(new Date(c.nextActionDate), "MMM d")
                      : "—"}
                  </td>
                  <td>
                    <button
                      onClick={() => onQuickLog(c)}
                      className="btn btn-secondary text-xs py-1 px-2 whitespace-nowrap"
                    >
                      Log &amp; Follow Up
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
