import { differenceInDays } from "date-fns";

// Three visible badges plus "none", which renders nothing at all.
export type ContactStatus = "overdue" | "needs-attention" | "active" | "none";

export interface StatusInfo {
  status: ContactStatus;
  label: string;
  color: string;
  bgColor: string;
  priority: number; // lower = more urgent
}

const STATUS_MAP: Record<ContactStatus, Omit<StatusInfo, "status" | "priority">> = {
  // Follow-up date is yesterday or earlier
  overdue: { label: "Overdue", color: "#ef4444", bgColor: "#fef2f2" },
  // Not touched in two months
  "needs-attention": { label: "Needs Attention", color: "#3b82f6", bgColor: "#eff6ff" },
  // Follow-up date is today or later
  active: { label: "Active", color: "#10b981", bgColor: "#ecfdf5" },
  // Touched recently, nothing scheduled: no badge
  none: { label: "", color: "#8c8c8c", bgColor: "transparent" },
};

const PRIORITY: Record<ContactStatus, number> = {
  overdue: 0,
  "needs-attention": 1,
  active: 2,
  none: 3,
};

// Untouched for this long counts as needing attention.
const STALE_DAYS = 60;

export function getContactStatus(contact: {
  lastContactDate: string | null;
  nextActionDate: string | null;
  nextAction: string | null;
  lastInteraction: string | null;
}): StatusInfo {
  // Use Israel timezone for date comparisons
  const nowInIsrael = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
  const todayInIsrael = new Date(nowInIsrael.getFullYear(), nowInIsrael.getMonth(), nowInIsrael.getDate());
  const now = new Date();
  const lastContact = contact.lastContactDate ? new Date(contact.lastContactDate) : null;
  const nextDate = contact.nextActionDate ? new Date(contact.nextActionDate) : null;

  let status: ContactStatus;

  if (nextDate && nextDate < todayInIsrael) {
    // Due yesterday or earlier. Beats staleness.
    status = "overdue";
  } else if (lastContact && differenceInDays(now, lastContact) >= STALE_DAYS) {
    // Two months without contact, even if something is scheduled ahead.
    status = "needs-attention";
  } else if (nextDate) {
    // Scheduled for today or later.
    status = "active";
  } else {
    // Touched recently with nothing scheduled: no badge.
    status = "none";
  }

  return {
    status,
    priority: PRIORITY[status],
    ...STATUS_MAP[status],
  };
}

export function getDaysSinceContact(lastContactDate: string | null): number | null {
  if (!lastContactDate) return null;
  return differenceInDays(new Date(), new Date(lastContactDate));
}
