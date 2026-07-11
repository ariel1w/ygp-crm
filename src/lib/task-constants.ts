// Categories for Ariel's private task list. `key` is stored in the DB; `label`
// is shown in the UI. Order here is the display order of the sections.
export const TASK_CATEGORIES = [
  { key: "clients", label: "Agents / סוכנים", color: "#6366f1", icon: "🎬" },
  { key: "projects", label: "Projects / פרוייקטים", color: "#10b981", icon: "📁" },
  { key: "contacts", label: "Contacts / אנשי קשר", color: "#0ea5e9", icon: "👤" },
  { key: "events", label: "Events / אירועים", color: "#f59e0b", icon: "📅" },
  { key: "ideas", label: "Ideas / רעיונות", color: "#a855f7", icon: "💡" },
  { key: "admin", label: "Admin / כללי", color: "#64748b", icon: "🗂️" },
] as const;

export function categoryColor(key: string): string {
  return TASK_CATEGORIES.find((c) => c.key === key)?.color ?? "#64748b";
}

export function categoryIcon(key: string): string {
  return TASK_CATEGORIES.find((c) => c.key === key)?.icon ?? "🗂️";
}

export const TASK_CATEGORY_KEYS = TASK_CATEGORIES.map((c) => c.key);

export function categoryLabel(key: string): string {
  return TASK_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
