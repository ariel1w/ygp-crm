/**
 * Where a project stands with one person. The order here is the order the
 * groups appear on a project page, and the order used to rank a project's
 * activity in the list. Change a label and it changes everywhere.
 */
export const PROJECT_STATUSES = [
  { key: "topitch", label: "To pitch", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "sent", label: "Sent", color: "#2563eb", bg: "#eff6ff" },
  { key: "withthem", label: "With them", color: "#d97706", bg: "#fffbeb" },
  { key: "interested", label: "Interested", color: "#10b981", bg: "#ecfdf5" },
  { key: "passed", label: "Passed", color: "#6b7280", bg: "#f3f4f6" },
  { key: "deal", label: "Deal", color: "#f04e5e", bg: "#fef2f2" },
] as const;

export type ProjectStatusKey = (typeof PROJECT_STATUSES)[number]["key"];

export const DEFAULT_STATUS: ProjectStatusKey = "sent";

export function statusInfo(key: string) {
  return (
    PROJECT_STATUSES.find((s) => s.key === key) ??
    PROJECT_STATUSES.find((s) => s.key === DEFAULT_STATUS)!
  );
}

/** Statuses that mean the project is live with this person right now. */
export const OPEN_STATUSES: string[] = ["topitch", "sent", "withthem", "interested"];
