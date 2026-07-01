"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  companyType: string | null;
  owner: string | null;
}

interface Project {
  id: string;
  name: string;
  contacts: { contact: Contact; createdAt: string }[];
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then(setProject);
  }, [id]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Delete this project? It will be unlinked from all contacts."
      )
    )
      return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/projects");
  };

  if (!project) return <p className="text-muted text-sm py-8">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-muted hover:text-foreground mb-2 block"
      >
        &larr; Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <button onClick={handleDelete} className="btn btn-danger">
          Delete Project
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Contact</th>
              <th>Company</th>
              <th>Type</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {project.contacts.map((c) => (
              <tr key={c.contact.id}>
                <td>
                  <Link
                    href={`/contacts/${c.contact.id}`}
                    className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {c.contact.name}
                  </Link>
                </td>
                <td>{c.contact.company || "—"}</td>
                <td>
                  {c.contact.companyType ? (
                    <span className="badge badge-type">
                      {c.contact.companyType}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{c.contact.owner || "—"}</td>
              </tr>
            ))}
            {project.contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-8">
                  No contacts have been sent this project yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
