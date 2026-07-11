// Categories for Ariel's private task list. `key` is stored in the DB; `label`
// is shown in the UI. Order here is the display order of the sections.
export const TASK_CATEGORIES = [
  { key: "clients", label: "Agents / סוכנים" },
  { key: "projects", label: "Projects / פרוייקטים" },
  { key: "contacts", label: "Contacts / אנשי קשר" },
  { key: "events", label: "Events / אירועים" },
  { key: "ideas", label: "Ideas / רעיונות" },
  { key: "admin", label: "Admin / כללי" },
] as const;

export const TASK_CATEGORY_KEYS = TASK_CATEGORIES.map((c) => c.key);

export function categoryLabel(key: string): string {
  return TASK_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
