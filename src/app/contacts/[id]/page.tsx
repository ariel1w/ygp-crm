"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { COMPANY_TYPES, TEAM_MEMBERS } from "@/lib/constants";
import { getContactStatus, getDaysSinceContact } from "@/lib/status";
import QuickLog from "@/components/QuickLog";

interface Note {
  id: string;
  author: string;
  content: string;
  date: string;
}

interface Project {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  companyType: string | null;
  owner: string | null;
  lastContactDate: string | null;
  lastInteraction: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  notes: Note[];
  projects: { project: Project }[];
}

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    companyType: "",
    owner: "",
    lastContactDate: "",
    lastInteraction: "",
    nextAction: "",
    nextActionDate: "",
    projectIds: [] as string[],
  });

  const loadContact = () => {
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then((c) => {
        setContact(c);
        setForm({
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          company: c.company || "",
          companyType: c.companyType || "",
          owner: c.owner || "",
          lastContactDate: c.lastContactDate
            ? format(new Date(c.lastContactDate), "yyyy-MM-dd")
            : "",
          lastInteraction: c.lastInteraction || "",
          nextAction: c.nextAction || "",
          nextActionDate: c.nextActionDate
            ? format(new Date(c.nextActionDate), "yyyy-MM-dd")
            : "",
          projectIds: c.projects.map(
            (p: { project: Project }) => p.project.id
          ),
        });
      });
  };

  useEffect(() => {
    loadContact();
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setAllProjects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditing(false);
    setSaving(false);
    loadContact();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    router.push("/contacts");
  };

  const toggleProject = (pid: string) => {
    setForm((f) => ({
      ...f,
      projectIds: f.projectIds.includes(pid)
        ? f.projectIds.filter((p) => p !== pid)
        : [...f.projectIds, pid],
    }));
  };

  if (!contact) return (
    <div className="flex items-center justify-center py-20">
      <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );

  const statusInfo = getContactStatus(contact);
  const daysSince = getDaysSinceContact(contact.lastContactDate);

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-muted hover:text-foreground mb-3 block"
      >
        &larr; Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <span
              className="badge"
              style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
            >
              {statusInfo.label}
            </span>
          </div>
          {contact.company && (
            <p className="text-muted">
              {contact.company}
              {contact.companyType && (
                <span className="badge badge-type ml-2">{contact.companyType}</span>
              )}
            </p>
          )}
          {contact.owner && (
            <p className="text-sm text-muted mt-1">Owned by {contact.owner}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickLog(true)}
            className="btn btn-primary"
          >
            Log Interaction
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="btn btn-secondary"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <div className="card space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Type</label>
              <select
                value={form.companyType}
                onChange={(e) => setForm({ ...form, companyType: e.target.value })}
              >
                <option value="">Select...</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Owner</label>
              <select
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              >
                <option value="">Select...</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Next Action</label>
            <input
              value={form.nextAction}
              onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Last Contact Date</label>
              <input
                type="date"
                value={form.lastContactDate}
                onChange={(e) => setForm({ ...form, lastContactDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Next Action Date</label>
              <input
                type="date"
                value={form.nextActionDate}
                onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Projects Sent</label>
            <div className="flex flex-wrap gap-2">
              {allProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProject(p.id)}
                  className={`badge cursor-pointer text-sm py-1 px-3 ${
                    form.projectIds.includes(p.id)
                      ? "bg-primary text-white"
                      : "badge-type"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      ) : (
        <>
          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                Contact Info
              </h3>
              <dl className="space-y-2 text-sm">
                {contact.email && (
                  <div>
                    <dt className="text-muted text-xs">Email</dt>
                    <dd>{contact.email}</dd>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <dt className="text-muted text-xs">Phone</dt>
                    <dd>{contact.phone}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="card">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                Follow-Up
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted text-xs">Next Action</dt>
                  <dd className="font-medium">{contact.nextAction || "None set"}</dd>
                </div>
                <div>
                  <dt className="text-muted text-xs">Due Date</dt>
                  <dd>
                    {contact.nextActionDate
                      ? format(new Date(contact.nextActionDate), "MMM d, yyyy")
                      : "No date set"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs">Last Contact</dt>
                  <dd>
                    {contact.lastContactDate
                      ? `${format(new Date(contact.lastContactDate), "MMM d, yyyy")} (${daysSince} days ago)`
                      : "Never"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="card">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                Projects Sent
              </h3>
              {contact.projects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {contact.projects.map((p) => (
                    <span key={p.project.id} className="badge badge-type text-xs">
                      {p.project.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">None</p>
              )}
            </div>
          </div>

          {/* Last interaction summary */}
          {contact.lastInteraction && (
            <div className="card mb-6">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Latest Interaction
              </h3>
              <p className="text-sm">{contact.lastInteraction}</p>
            </div>
          )}
        </>
      )}

      {/* Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Timeline</h3>
          <button
            onClick={() => setShowQuickLog(true)}
            className="btn btn-primary text-sm"
          >
            + Log Interaction
          </button>
        </div>

        {contact.notes.length > 0 ? (
          <div className="space-y-0">
            {contact.notes.map((note, i) => (
              <div
                key={note.id}
                className={`flex gap-4 py-3 ${i < contact.notes.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold"
                  >
                    {note.author.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{note.author}</span>
                    <span className="text-xs text-muted">
                      {format(new Date(note.date), "MMM d, yyyy")}
                      {" "}
                      ({formatDistanceToNow(new Date(note.date), { addSuffix: true })})
                    </span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted py-4 text-center">
            No interactions logged yet. Click &ldquo;Log Interaction&rdquo; to add the first one.
          </p>
        )}
      </div>

      {showQuickLog && (
        <QuickLog
          contact={contact}
          onClose={() => setShowQuickLog(false)}
          onSaved={() => {
            setShowQuickLog(false);
            loadContact();
          }}
        />
      )}
    </div>
  );
}
