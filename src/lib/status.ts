import { differenceInDays } from "date-fns";

export type ContactStatus = "overdue" | "due-soon" | "active" | "cold" | "needs-attention" | "new";

export interface StatusInfo {
  status: ContactStatus;
  label: string;
  color: string;
  bgColor: string;
  priority: number; // lower = more urgent
}

const STATUS_MAP: Record<ContactStatus, Omit<StatusInfo, "status" | "priority">> = {
  overdue: { label: "Overdue", color: "#ef4444", bgColor: "#fef2f2" },
  "due-soon": { label: "Due Soon", color: "#f59e0b", bgColor: "#fffbeb" },
  "needs-attention": { label: "Needs Attention", color: "#f04e5e", bgColor: "#fef0f1" },
  cold: { label: "Going Cold", color: "#8c8c8c", bgColor: "#f5f5f5" },
  active: { label: "Active", color: "#10b981", bgColor: "#ecfdf5" },
  new: { label: "New", color: "#7c5cfc", bgColor: "#f3f0ff" },
};

const PRIORITY: Record<ContactStatus, number> = {
  overdue: 0,
  "due-soon": 1,
  "needs-attention": 2,
  cold: 3,
  active: 4,
  new: 5,
};

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
  const hasAnyInteraction = !!contact.lastInteraction || !!contact.lastContactDate;

  let status: ContactStatus;

  if (nextDate && nextDate < todayInIsrael) {
    status = "overdue";
  } else if (nextDate && differenceInDays(nextDate, now) <= 7) {
    status = "due-soon";
  } else if (!hasAnyInteraction) {
    status = "new";
  } else if (lastContact && differenceInDays(now, lastContact) > 60) {
    status = "cold";
  } else if (lastContact && differenceInDays(now, lastContact) > 30 && !nextDate) {
    status = "needs-attention";
  } else if (contact.nextAction || nextDate) {
    status = "active";
  } else if (lastContact && differenceInDays(now, lastContact) > 21 && !contact.nextAction) {
    status = "needs-attention";
  } else {
    status = "active";
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
