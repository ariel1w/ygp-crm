"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PROJECT_STATUSES, statusInfo } from "@/lib/project-status";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  companyType: string | null;
  owner: string | null;
}

interface Link_ {
  id: string;
  contact: Contact;
  status: string;
  statusAt: string;
  sentDate: string | null;
  note: string;
}

interface Pitch {
  id: string;
  name: string;
  company: string | null;
  note: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  contacts: Link_[];
  pitches: Pitch[];
}

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
    : "—";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [who, setWho] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then(setProject);

  useEffect(() => {
    load();
    fetch("/api/contacts")
      .then((r) => r.json())
      .then(setAllContacts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onProject = useMemo(
    () => new Set(project?.contacts.map((c) => c.contact.id) ?? []),
    [project]
  );

  // Type a name: if it is already a contact we offer it, otherwise the line
  // goes on the pitch list as plain text.
  const suggestions = useMemo(() => {
    const q = who.trim().toLowerCase();
    if (q.length < 2) return [];
    return allContacts
      .filter(
        (c) =>
          !onProject.has(c.id) &&
          (c.name.toLowerCase().includes(q) ||
            (c.company || "").toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [who, allContacts, onProject]);

  const addExisting = async (contactId: string) => {
    setBusy(true);
    await fetch(`/api/projects/${id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, status: "topitch" }),
    });
    setWho("");
    setCompany("");
    await load();
    setBusy(false);
  };

  const addPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!who.trim()) return;
    setBusy(true);
    await fetch(`/api/projects/${id}/pitches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: who.trim(), company: company.trim() }),
    });
    setWho("");
    setCompany("");
    await load();
    setBusy(false);
  };

  const setStatus = async (linkId: string, status: string) => {
    await fetch(`/api/project-contacts/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const removeLink = async (linkId: string, name: string) => {
    if (!confirm(`Take ${name} off this project?`)) return;
    await fetch(`/api/project-contacts/${linkId}`, { method: "DELETE" });
    load();
  };

  const sendPitch = async (pitchId: string) => {
    await fetch(`/api/pitches/${pitchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", status: "sent" }),
    });
    load();
  };

  const removePitch = async (pitchId: string, name: string) => {
    if (!confirm(`Remove ${name} from the pitch list?`)) return;
    await fetch(`/api/pitches/${pitchId}`, { method: "DELETE" });
    load();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project? It will be unlinked from all contacts."))
      return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/projects");
  };

  if (!project)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );

  const statusPicker = (link: Link_) => (
    <select
      value={link.status}
      onChange={(e) => setStatus(link.id, e.target.value)}
      className="text-xs py-1 px-2 w-auto font-semibold"
      style={{
        color: statusInfo(link.status).color,
        backgroundColor: statusInfo(link.status).bg,
      }}
    >
      {PROJECT_STATUSES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  );

  const toPitchLinks = project.contacts.filter((c) => c.status === "topitch");

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-muted hover:text-foreground mb-2 block"
      >
        &larr; Back
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <button onClick={handleDelete} className="btn btn-danger">
          Delete Project
        </button>
      </div>

      {/* Pitch list: who we still want to send this to. */}
      <div className="card mb-4">
        <h2 className="font-bold mb-2">
          To pitch{" "}
          <span className="text-muted font-normal text-sm">
            ({project.pitches.length + toPitchLinks.length})
          </span>
        </h2>

        <form onSubmit={addPitch} className="flex gap-2 mb-3 relative">
          <div className="flex-1 relative">
            <input
              placeholder="Who should get this?"
              value={who}
              onChange={(e) => setWho(e.target.value)}
            />
            {suggestions.length > 0 && (
              <div className="absolute z-40 left-0 right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                <div className="px-2 py-1 text-xs text-muted bg-[var(--primary-light)]">
                  Already in the CRM
                </div>
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addExisting(c.id)}
                    className="block w-full text-left px-2 py-1.5 text-sm hover:bg-[var(--primary-light)]"
                  >
                    {c.name}
                    {c.company && (
                      <span className="text-muted"> · {c.company}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            className="btn btn-primary whitespace-nowrap"
            disabled={busy}
          >
            Add
          </button>
        </form>

        {project.pitches.length === 0 && toPitchLinks.length === 0 ? (
          <p className="text-sm text-muted italic">
            Nobody queued up. Type a name above, it does not have to be a
            contact yet.
          </p>
        ) : (
          <table>
            <tbody>
              {project.pitches.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.name}</td>
                  <td className="text-sm">{p.company || "—"}</td>
                  <td className="text-sm text-muted">not a contact yet</td>
                  <td className="text-right whitespace-nowrap">
                    <button
                      onClick={() => sendPitch(p.id)}
                      className="btn btn-secondary text-xs py-1 px-2 mr-1"
                    >
                      Mark sent
                    </button>
                    <button
                      onClick={() => removePitch(p.id, p.name)}
                      className="text-muted hover:text-danger text-sm px-1"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
              {toPitchLinks.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link
                      href={`/contacts/${l.contact.id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                    >
                      {l.contact.name}
                    </Link>
                  </td>
                  <td className="text-sm">{l.contact.company || "—"}</td>
                  <td className="text-sm text-muted">{l.contact.owner || ""}</td>
                  <td className="text-right whitespace-nowrap">
                    {statusPicker(l)}
                    <button
                      onClick={() => removeLink(l.id, l.contact.name)}
                      className="text-muted hover:text-danger text-sm px-1 ml-1"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Everyone who already has it, grouped by where it stands. */}
      {PROJECT_STATUSES.filter((s) => s.key !== "topitch").map((s) => {
        const rows = project.contacts.filter((c) => c.status === s.key);
        if (rows.length === 0) return null;
        return (
          <div key={s.key} className="card p-0 overflow-hidden mb-4">
            <div
              className="px-4 py-2 font-bold text-sm"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              {s.label} · {rows.length}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th className="whitespace-nowrap">Sent</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link
                        href={`/contacts/${l.contact.id}`}
                        className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                      >
                        {l.contact.name}
                      </Link>
                    </td>
                    <td>{l.contact.company || "—"}</td>
                    <td>
                      {l.contact.companyType ? (
                        <span className="badge badge-type">
                          {l.contact.companyType}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{l.contact.owner || "—"}</td>
                    <td className="text-sm text-muted whitespace-nowrap">
                      {fmt(l.sentDate ?? l.statusAt)}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {statusPicker(l)}
                      <button
                        onClick={() => removeLink(l.id, l.contact.name)}
                        className="text-muted hover:text-danger text-sm px-1 ml-1"
                        title="Remove"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {project.contacts.length === 0 && project.pitches.length === 0 && (
        <p className="text-center text-muted py-6">
          Nothing has happened on this project yet.
        </p>
      )}
    </div>
  );
}
