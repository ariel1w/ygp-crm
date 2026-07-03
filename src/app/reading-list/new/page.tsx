"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEAM_MEMBERS } from "@/lib/constants";

export default function NewSubmissionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    senderName: "",
    dateReceived: new Date().toISOString().split("T")[0],
    ygpContact: "",
    senderEmail: "",
    status: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/reading-list");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white drop-shadow mb-6">New Submission</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Project Name <span className="text-danger">*</span>
            </label>
            <input
              required
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sender Name</label>
            <input
              value={form.senderName}
              onChange={(e) => setForm({ ...form, senderName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Received</label>
            <input
              type="date"
              value={form.dateReceived}
              onChange={(e) => setForm({ ...form, dateReceived: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">YGP Contact</label>
            <select
              value={form.ygpContact}
              onChange={(e) => setForm({ ...form, ygpContact: e.target.value })}
            >
              <option value="">Select...</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email / Phone</label>
            <input
              value={form.senderEmail}
              onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <input
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add Submission"}
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
