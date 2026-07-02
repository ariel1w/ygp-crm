"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANY_TYPES, TEAM_MEMBERS } from "@/lib/constants";

interface Project {
  id: string;
  name: string;
}

export default function NewContactPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const contact = await res.json();
      router.push(`/contacts/${contact.id}`);
    }
    setSaving(false);
  };

  const toggleProject = (id: string) => {
    setForm((f) => ({
      ...f,
      projectIds: f.projectIds.includes(id)
        ? f.projectIds.filter((p) => p !== id)
        : [...f.projectIds, id],
    }));
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Contact</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-danger">*</span>
            </label>
            <input
              required
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
            <label className="block text-sm font-medium mb-1">
              Company Type
            </label>
            <select
              value={form.companyType}
              onChange={(e) =>
                setForm({ ...form, companyType: e.target.value })
              }
            >
              <option value="">Select...</option>
              {COMPANY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
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
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Last Contact Date
            </label>
            <input
              type="date"
              value={form.lastContactDate}
              onChange={(e) =>
                setForm({ ...form, lastContactDate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Follow-Up Date
            </label>
            <input
              type="date"
              value={form.nextActionDate}
              onChange={(e) =>
                setForm({ ...form, nextActionDate: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Last Interaction Summary
          </label>
          <textarea
            rows={2}
            value={form.lastInteraction}
            onChange={(e) =>
              setForm({ ...form, lastInteraction: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Next Action</label>
          <input
            value={form.nextAction}
            onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Projects Sent
          </label>
          <div className="flex flex-wrap gap-2">
            {projects.map((p) => (
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

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Contact"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
